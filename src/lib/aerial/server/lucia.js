import { dev } from '$app/environment'
import { json } from '@sveltejs/kit'
import { lucia } from 'lucia'
import { sveltekit } from 'lucia/middleware'
import { prisma as prismaAdapter } from '@lucia-auth/adapter-prisma'
import { providerUserAuth, __experimental_createOAuth2AuthorizationUrl } from '@lucia-auth/oauth'
import { google as luciaGoogleProvider } from '@lucia-auth/oauth/providers'
import { google } from 'googleapis'
import ShortUniqueId from 'short-unique-id'
import prisma from '$lib/prisma.js'
import { google_client_secret, google_oauth_callback_path, app_url, GlobalOAuth2Client } from '$lib/config.js'
import { getTokens, getProviderUser } from '$lib/aerial/server/oauth/google/index.js'
import { airy } from '$lib/aerial/hybrid/util.js'

/**
 * @type {import('lucia').Auth<import('lucia').Configuration>}
 */
export const luciaAuth = lucia({
    adapter: prismaAdapter(prisma, {
        user: 'authUser',
        key: 'authKey',
        session: 'authSession'
    }),
    env: dev ? 'DEV' : 'PROD',
    middleware: sveltekit(),
    /**
     * @param {import('lucia').UserSchema} user 
     * @returns {import('@lucia-auth/oauth/dist/lucia').LuciaDatabaseUserAttributes}
     */
    getUserAttributes: (user) => {
        return {
            id: user.id,
            name: user.name,
            // googleUsername: user.google_username,
            picture: user.picture
        }
    },
})

/**
 * Generate custom id for Lucia user
 * 
 * @returns {String}
 */
export function generateCustomUserId() {
    return `au_${new ShortUniqueId()()}`
}

/**
 * @typedef {Object} OAuthConfig
 * 
 * @property {String} clientId - Client id
 * @property {String} clientSecret - Client secret
 * @property {String[]} [scope] - Optional scopes
 */

/**
 * @typedef {OAuthConfig & { redirectUri: String, accessType?: 'online'|'offline' }} GoogleAuthConfig
 */

/**
 * @type {GoogleAuthConfig}
 */
export const googleAuthConfig = {
    clientId: google_client_secret.web.client_id,
    clientSecret: google_client_secret.web.client_secret,
    redirectUri: `${app_url}${google_oauth_callback_path}`,
    scope: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email', 
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
    ],
    accessType: 'offline',
}

/**
 * Typical way of initializing google oauth as shown in lucia docs.
 * Keeping this as a reference.
 */
export const googleAuth = luciaGoogleProvider(luciaAuth, googleAuthConfig)

/**
 * @callback CreateKey
 * @param {String} userId
 * @returns {Promise<import('lucia').Key>}
 */

/**
 * @callback CreateUser
 * @param {{
 *      userId?: String,
 *      attributes: import('@lucia-auth/oauth/dist/lucia').LuciaDatabaseUserAttributes
 * }} options
 * @returns {import('@lucia-auth/oauth/dist/lucia').LuciaUser}
 */

/**
 * @typedef {import('lucia').Auth & {
 *      existingUser: import('@lucia-auth/oauth/dist/lucia').LuciaUser,
 *      createKey: CreateKey,
 *      createUser: CreateUser
 * }} ProviderUserAuth
 */

/**
 * @typedef {ProviderUserAuth & {
 *      googleUser: import('@lucia-auth/oauth/providers').GoogleUser,
 *      googleTokens: {accessToken: String, refreshToken: String, accessTokenExpiresIn: Number}
 * }} GoogleUserAuth
 */

/**
 * @see {@link https://discord.com/channels/1004048134218981416/1142097564179648616 | Using abstract classes to define OAuth providers}
 */
class OAuth2Provider {
    /** @type {String} */
    providerId
    /** @type {import('lucia').Auth} */
    auth

    /**
     * @param {String} providerUserId 
     * @returns {Promise<ProviderUserAuth>}
     */
    async providerUserAuth(providerUserId) {
        return await providerUserAuth(this.auth, this.providerId, providerUserId)
    }

    /**
     * @param {String} providerId 
     * @param {import('lucia').Auth} auth 
     */
    constructor(providerId, auth) {
        this.providerId = providerId
        this.auth = auth
    }

    /**
     * This is an abstract method and must be implemented manually
     * 
     * @param {String} code 
     * @returns {Promise<ProviderUserAuth>}
     */
    async validateCallback(code) {}

    /**
     * This is an abstract method and must be implemented manually
     * 
     * @returns {Promise<[url: URL, state: String]>}
     */
    async getAuthorizationUrl() {}
}

/**
 * @see {@link https://discord.com/channels/1004048134218981416/1142097564179648616 | Using abstract classes to define OAuth providers}
 */
class GoogleAuth extends OAuth2Provider {
    /** @type {GoogleAuthConfig} */
    config

    /**
     * @param {import('lucia').Auth} auth 
     * @param {GoogleAuthConfig} config 
     */
    constructor(auth, config) {
        // super is the constructor of extended class OAuth2Provider
        super('google', auth)
        this.config = config
    }

    /**
     * @see lucia implementation at {@link @lucia-auth/oauth/dist/providers/google.js}
     * 
     * @param {String} code 
     * @returns {Promise<ProviderUserAuth & GoogleUserAuth>}
     */
    async validateCallback(code) {
        const googleTokens = await getTokens(code)
        const googleUser = await getProviderUser(googleTokens.accessToken)
        const providerUserId = googleUser.sub
        const googleUserAuth = await this.providerUserAuth(providerUserId)
        return {
            ...googleUserAuth,
            googleUser,
            googleTokens
        }
    }

    /**
     * @returns {Promise<[url: URL, state: String]>}
     */
    async getAuthorizationUrl() {
        const scopeConfig = this.config.scope ?? []
        const defaultScope = ["https://www.googleapis.com/auth/userinfo.profile"]

        return await __experimental_createOAuth2AuthorizationUrl('https://accounts.google.com/o/oauth2/v2/auth', {
            clientId: this.config.clientId,
            redirectUri: this.config.redirectUri,
            scope: Array.from(new Set(defaultScope.concat(scopeConfig))),
            searchParams: {
                access_type: this.config.accessType ?? 'online'
            }
        })
    }
}

/**
 * @callback GetAuthorizationUrl
 * @param {String} state
 * @returns {Promise<URL>}
 */

/**
 *  {{ providerId: String, getAuthorizationUrl: GetAuthorizationUrl, getTokens: import('./oauth/google').GetTokens, getProviderUser: import('./oauth/google').GetProviderUser }}
 */
const aerialGoogleAuthConfig = {
    providerId: 'google',
    // This is just a dummy, we will not use this method since we will use GIS
    getAuthorizationUrl: async (state) => {
        return new URL(`${app_url}${google_oauth_callback_path}`)
    },
    getTokens,
    getProviderUser
}
// Migrate to Lucia v2
// export const aerialGoogleAuth = provider(luciaAuth, aerialGoogleAuthConfig)
export const aerialGoogleAuth = new GoogleAuth(luciaAuth, googleAuthConfig)

/**
 * Get Lucia active session
 * 
 * @param {import('@sveltejs/kit').RequestEvent} RequestEvent
 * @returns {String|undefined}
 */
function getActiveSession({ cookies }) {
    const session = cookies.get('auth_session')
    return session
}

/**
 * Get token info
 * 
 * Similar with what OAuth2Client.getTokenInfo does
 * @see {@link https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest/google-auth-library/oauth2client#google_auth_library_OAuth2Client_getTokenInfo_member_1_ | getTokenInfo}
 * 
 * @param {String} access_token 
 * @returns {import('googleapis').Auth.TokenInfo} TokenInfo
 */
async function getTokenInfo(access_token) {
    return await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${access_token}`)
        .then((response) => response.json())
        .catch((error) => {
            throw new Error(error)
        })
}

/**
 * Lucia sveltekit hooks handle
 * 
 * @type {import('@sveltejs/kit').Handle}
 * @returns {import('@sveltejs/kit').MaybePromise}
 */
export async function svelteHandleLuciaAuth({ event, resolve }) {
    event.locals.luciaAuth = luciaAuth.handleRequest(event)

    let authToken
    const sessionId = getActiveSession(event)
    const googleOauthClient = new google.auth.OAuth2(
        google_client_secret.web.client_id,
        google_client_secret.web.client_secret,
        `${app_url}${google_oauth_callback_path}`
    )
    const autorizationHeader = event.request.headers.get('Authorization')

    /**
     * When quirrel sends a post request for the job endpoint it does not have Authorization headers
     * (as we need the Bearer token for our handle hook). This breaks the validation setup for
     * access_token preventing svelteHandleLuciaAuth to call getTokenInfo which also prevent us
     * from calling refreshAccessToken since we don't have any credentials.
     * 
     * Just before the app hand over the job to quirrel we set the globalThis[GlobalOAuth2Client]
     * property in `routes/queue/+page.server.js`, this makes our googleOauthClient available in
     * global server context and it stays for the whole lifecycle of the app unless removed or changed.
     * 
     * Once quirrel sends out the job execution to our job endpoint we then intercept the request
     * and assign the globalThis[GlobalOAuth2Client] credentials to local googleOauthClient within
     * this function.
     */
    if (event.url.pathname.startsWith('/api/quirrel/job/color-extraction')) {
        airy({ topic: 'hooks', message: globalThis[GlobalOAuth2Client], label: 'GlobalOAuth2Client:'})
        /**
         * @type {import('googleapis').Auth.OAuth2Client}
         */
        const globalOauthClient = globalThis[GlobalOAuth2Client]
        googleOauthClient.setCredentials({ ...globalOauthClient.credentials })
    }

    /**
     * Figure out whether request is coming from API or client and set credentials accordingly
     */
    if (autorizationHeader?.toLowerCase().startsWith('bearer')) {
        try {
            const bearerToken = autorizationHeader.match(/^bearer (.+)$/i)?.[1]
            authToken = await prisma.authToken.findFirstOrThrow({
                select: {
                    key_id: true,
                    access_token: true,
                    refresh_token: true,
                    expiry_date: true,
                },
                where: {
                    aerial_token: bearerToken
                }
            })
            const { key_id, ...authTokenCredentials } = authToken
            googleOauthClient.setCredentials({
                ...authTokenCredentials,
                // id_token,
                token_type: 'Bearer',
                scope: googleAuthConfig.scope.join(' ')
            })
        } catch (error) {
            airy({ topic: 'hooks', message: 'Unauthorized', label: 'svelteHandleLuciaAuth:' })
            return new json({ message: 'Unauthorized' }, { status: 401 })
        }
    } else {
        if (sessionId) {
            // Call me evil, this is the cost of having relationships
            const session = await prisma.authSession.findFirst({
                select: {
                    user_id: true,
                    auth_user: {
                        select: {
                            auth_key: {
                                select: {
                                    id: true,
                                    user_id: true,
                                    auth_token: {
                                        select: {
                                            key_id: true,
                                            access_token: true,
                                            refresh_token: true,
                                            expiry_date: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                where: {
                    id: sessionId
                }
            })

            // airy({ message: session, label: '[Hooks] Session:' })

            if (session) {
                authToken = session.auth_user.auth_key.filter((key) => key.id.startsWith('google:'))?.[0]?.auth_token
                const { id: authTokenId, key_id, ...authTokenCredentials } = authToken
                googleOauthClient.setCredentials({
                    ...authTokenCredentials,
                    token_type: 'Bearer',
                    scope: googleAuthConfig.scope.join(' ')
                })
            }
        }
    }

    // airy({ topic: 'hooks', message: googleOauthClient, label: 'Before tokenInfo:' })

    let tokenInfo, newAccessToken
    if (googleOauthClient.credentials.hasOwnProperty('access_token') && googleOauthClient.credentials.hasOwnProperty('refresh_token')) {
        try {
            // Check if token is still valid
            tokenInfo = await googleOauthClient.getTokenInfo(googleOauthClient.credentials.access_token)
            airy({ topic: 'hooks', message: tokenInfo.sub, label: 'token_info' })
        } catch (error) {
            airy({ topic: 'hooks', message: error.response.data, label: 'tokenInfo Error:' })
            // throw new Error(error.response.data, 400)

            try {
                // Refresh access_token using refresh_token
                newAccessToken = await googleOauthClient.refreshAccessToken()

                // Used for testing curl requests
                // googleOauthClient.credentials.access_token = 'Test curl request 3'
                // newAccessToken = googleOauthClient

                const { token_type, scope, id_token, ...newAccessTokenCredentials } = newAccessToken.credentials

                // Save new active token to database
                if (authToken) {
                    await prisma.authToken.update({
                        where: {
                            key_id: authToken.key_id
                        },
                        data: {
                            ...newAccessTokenCredentials
                        }
                    })
                }
            } catch (error) {
                await airy({ topic: 'hooks', message: error.response.data, label: 'refreshAccessToken Error:' })
                /**
                 * invalid_grant usually means the user removed/revoked the connection in their google account
                 * or the refresh token expired which only happens when google app service is in testing,
                 * tokens with offline access type won't have their refresh token expire
                 */
                if (error.response.data.error === 'invalid_grant') {
                    await airy({ topic: 'hooks', message: 'Removing invalid session, cookies and keys.' })
                    /**
                     * Cascade delete from AuthUser
                     * Right now /api/oauth/google/callback creates a new user when
                     * aerialGoogleAuth.validateCallback has no existingUser, deleting the AuthUser directly would
                     * prevent us having multiple users with the same name, if we want to support multiple oauth,
                     * we must modify the logic to support account linking instead.
                     * 
                     * @see {@link https://lucia-auth.com/guidebook/oauth-account-linking | Guide to OAuth account linking}
                     */
                    if (sessionId) {
                        const session = await prisma.authSession.findFirst({
                            select: {
                                user_id: true
                            },
                            where: {
                                id: sessionId
                            },
                        })
                        await prisma.authUser.delete({
                            where: {
                                id: session.user_id
                            }
                        })
                        event.cookies.delete('auth_session')
                        event.cookies.delete('google_oauth_state')

                        // notify user about the revocation or expiration of their session
                        event.locals.session = {
                            message: 'Access has been revoked or expired, if this was not intended please try logging in again.'
                        }
                    }

                    if (autorizationHeader) {
                        const key = await prisma.authKey.findFirst({
                            select: {
                                user_id: true
                            },
                            where: {
                                id: authToken.key_id
                            }
                        })
                        await prisma.authUser.delete({
                            where: {
                                id: key.user_id
                            }
                        })
                        // this one is for api response
                        return json({ message: 'Access has been revoked or expired, if this was not intended please try logging in again and get a new api key.' }, { status: 400 })
                    }
                }
            }
        }
    }

    // Set the new token on googleOauthClient
    if (newAccessToken) {
        airy({ topic: 'hooks', message: newAccessToken.credentials, label: 'new_access_token' })
        googleOauthClient.setCredentials({ ...newAccessToken.credentials })
    }

    // Cascade googleOauthClient by assigning it to locals
    event.locals.googleOauthClient = googleOauthClient

    return await resolve(event)
}

export default {
    luciaAuth,
    googleAuth,
    aerialGoogleAuth,
    googleAuthConfig,
    svelteHandleLuciaAuth
}
