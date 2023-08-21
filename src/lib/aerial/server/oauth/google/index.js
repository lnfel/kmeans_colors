import { error } from '@sveltejs/kit'
import { google } from 'googleapis'
// Please see https://github.com/pilcrowOnPaper/lucia/issues/852
// import { connectAuth } from '@lucia-auth/oauth/core.js'
import { google_client_secret, app_url, google_oauth_callback_path } from '$lib/config.js'

/**
 * @callback GetTokens
 * @param {String} code - Code from authorization moment
 * @param {'postmessage'} redirect_uri
 * @returns {Promise<{accessToken: String, refreshToken: String, accessTokenExpiresIn: Number}>}
 */
export async function getTokens(code, redirect_uri = 'postmessage') {
    /**
     * @type {import('google-auth-library').OAuth2ClientOptions}
     */
    const oauth2ClientOptions = {
        clientId: google_client_secret.web.client_id,
        clientSecret: google_client_secret.web.client_secret,
        redirectUri: redirect_uri
    }
    const oauth2Client = new google.auth.OAuth2(oauth2ClientOptions)
    const { tokens } = await oauth2Client.getToken(code.toString()).catch((e) => {
        if (e.message === 'redirect_uri_mismatch') {
            // airy({ message: `Redirect uri mismatch. Client is configured with ${redirect_uri}.`, label: '[Google OAuth] Error:' })
            throw error(500, 'OAuth redirect_uri mismatch.')
        }
        throw error(403, e.response?.data?.error_description ?? 'Could not obtain tokens from oauth2 code')
    })

    return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiresIn: tokens.expiry_date,
        // idToken: tokens.id_token
    }
}

/**
 * @typedef {[String, import('@lucia-auth/oauth/providers').GoogleUser]} ProviderUserResult
 */

/**
 * @callback GetProviderUser
 * @param {String} access_token 
 * @returns {Promise<ProviderUserResult>}
 */
export async function getProviderUser(access_token) {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Accept': 'application/json'
        }
    })
    /**
     * @type {import('@lucia-auth/oauth/providers').GoogleUser}
     */
    const googleUser = await response.json()
    /**
     * @type {String}
     */
    const googleUserId = googleUser.sub
    // Migrate to Lucia v2
    // return [googleUserId, googleUser]
    return googleUser
}

/**
 * No need for this anymore since we are using a custom provider
 * @param {String} code 
 */
// export async function validateCallback(code) {
//     const tokens = await getTokens(code)
//     const providerUser = await getProviderUser(tokens.accessToken)
//     const providerUserId = providerUser.sub
//     // Please see https://github.com/pilcrowOnPaper/lucia/issues/852
//     // const providerAuth = await connectAuth(luciaAuth, 'google', providerUserId)
//     // return {
//     //     ...providerAuth,
//     //     providerUser,
//     //     tokens
//     // }
// }
