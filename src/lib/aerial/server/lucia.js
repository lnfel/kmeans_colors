import lucia from 'lucia-auth'
import { sveltekit } from 'lucia-auth/middleware'
import prismaAdapter from '@lucia-auth/adapter-prisma'
import { dev } from '$app/environment'
import { provider } from '@lucia-auth/oauth'
import { google } from '@lucia-auth/oauth/providers'
import PrismaClient from '$lib/prisma.js'
import { google_client_secret, google_oauth_callback_path, app_url } from '$lib/config.js'
import { getTokens, getProviderUser } from '$lib/aerial/server/oauth/google/index.js'

/**
 * @type {import('lucia-auth').Auth<import('lucia-auth').Configuration>}
 */
export const luciaAuth = lucia({
    adapter: prismaAdapter(PrismaClient),
    env: dev ? 'DEV' : 'PROD',
    middleware: sveltekit(),
    transformDatabaseUser: (user) => {
        return {
            id: user.id,
            name: user.name,
            picture: user.picture
        }
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
const googleAuthConfig = {
    clientId: google_client_secret.web.client_id,
    clientSecret: google_client_secret.web.client_secret,
    redirectUri: `${app_url}${google_oauth_callback_path}`,
    scope: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email', 
        'https://www.googleapis.com/auth/drive.file'
    ],
    accessType: 'offline',
}

export const googleAuth = google(luciaAuth, googleAuthConfig)

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

export default {
    luciaAuth,
    googleAuth,
    aerialGoogleAuth
}
