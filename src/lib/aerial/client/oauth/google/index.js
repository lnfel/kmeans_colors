import { generateState } from "@lucia-auth/oauth"
import { dev } from '$app/environment'
import { PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_GOOGLE_OAUTH_CALLBACK_PATH, PUBLIC_APP_URL } from "$env/static/public"

/**
 * Credits to HaldanJ (https://github.com/HalfdanJ) and his work svelte-google-auth
 * https://github.com/HalfdanJ/svelte-google-auth
 */

/**
 * Dynamically inject script into browser context
 * 
 * @param {String} src Script's url
 */
async function injectScript(src) {
    return new Promise((resolve, reject) => {
        const googscr = document.createElement('script');
        googscr.type = 'text/javascript';
        googscr.src = src;
        googscr.defer = true;
        googscr.onload = resolve;
        googscr.onerror = reject;
        document.head.appendChild(googscr);
    })
}
/**
 * Load Google Identity Services Library, loads itself onto the window as 'google'
 * 
 * @returns {Promise<void>}
 */
export async function loadGIS() {
    if (window.google?.accounts?.oauth2) return;
    return await injectScript('https://accounts.google.com/gsi/client')
}

/**
 * Load Googleapis library
 * 
 * @returns {Promise<void>}
 */
export async function loadGAPI() {
    if (window.gapi) return;
    return await injectScript('https://apis.google.com/js/api.js')
}

/**
 * Sign in with Google OAuth using Google Identity Services (with popup enabled)
 * 
 * Authorization code flow 
 * https://developers.google.com/identity/oauth2/web/guides/migration-to-gis#the_new_way_2
 * 
 * @param {Array} scopes Google OAuth scopes
 * @returns {Promise<void>}
 */
export async function signInWithGoogle(scopes = ['openid', 'profile', 'email']) {
    await loadGIS()
    // console.log(google)

    return new Promise((resolve, reject) => {
        // Set google_oauth_state using lucia's generateRandomString
        const luciaState = generateState()
        document.cookie = `google_oauth_state=${luciaState};max-age=3600;path='/';secure;samesite=lax`

        const client = window.google.accounts.oauth2.initCodeClient({
            client_id: PUBLIC_GOOGLE_CLIENT_ID,
            scope: scopes.join(' '),
            ux_mode: 'popup',
            callback: (response) => {
                const { code, scope } = response
                
                const xhr = new XMLHttpRequest()
                xhr.open('POST', `${PUBLIC_APP_URL}${PUBLIC_GOOGLE_OAUTH_CALLBACK_PATH}`, true)
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
                xhr.setRequestHeader('Accept', 'application/json')
                // Set custom header for CRSF
                xhr.setRequestHeader('X-Requested-With', 'XmlHttpRequest')
                xhr.onload = async function () {
                    console.log('[Google OAuth] Code response: OK')
                    resolve()
                }
                xhr.onerror = reject
                xhr.onabort = reject
                xhr.send(`code=${code}&state=${luciaState}`)
            }
        })
        client.requestCode()
    })
}

export default {
    loadGIS,
    loadGAPI,
    signInWithGoogle
}
