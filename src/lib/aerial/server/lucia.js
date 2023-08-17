import { dev } from '$app/environment'
import { json } from '@sveltejs/kit'
import lucia from 'lucia-auth'
import { sveltekit } from 'lucia-auth/middleware'
import prismaAdapter from '@lucia-auth/adapter-prisma'
import { provider } from '@lucia-auth/oauth'
import { google as luciaGoogleProvider } from '@lucia-auth/oauth/providers'
import { google } from 'googleapis'
import ShortUniqueId from 'short-unique-id'
import prisma from '$lib/prisma.js'
import { google_client_secret, google_oauth_callback_path, app_url, GlobalOAuth2Client } from '$lib/config.js'
import { getTokens, getProviderUser } from '$lib/aerial/server/oauth/google/index.js'
import { airy } from '$lib/aerial/hybrid/util.js'

/**
 * @type {import('lucia-auth').Auth<import('lucia-auth').Configuration>}
 */
export const luciaAuth = lucia({
    adapter: prismaAdapter(prisma),
    env: dev ? 'DEV' : 'PROD',
    middleware: sveltekit(),
    transformDatabaseUser: (user) => {
        return {
            id: user.id,
            name: user.name,
            picture: user.picture
        }
    },
    generateCustomUserId: async () => {
        return `au_${new ShortUniqueId()()}`
    }
})

/**
 * @typedef {Object} OAuthConfig
 * 
 * @property {String} clientId - Client id
 * @property {String} clientSecret - Client secret
 * @property {String[]} [scope] - Optional scopes
 */

/**
 * @type {OAuthConfig & { redirectUri: String, accessType?: 'online'|'offline' }}
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

// Deprecation notice
// TODO: we are using custom google provider
export const googleAuth = luciaGoogleProvider(luciaAuth, googleAuthConfig)

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
export const aerialGoogleAuth = provider(luciaAuth, aerialGoogleAuthConfig)

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
                    access_token: bearerToken
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

            authToken = session.auth_user.auth_key.filter((key) => key.id.startsWith('google:'))?.[0]?.auth_token
            const { id: authTokenId, key_id, ...authTokenCredentials } = authToken
            googleOauthClient.setCredentials({
                ...authTokenCredentials,
                token_type: 'Bearer',
                scope: googleAuthConfig.scope.join(' ')
            })
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
