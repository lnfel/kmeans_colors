import * as path from "path"
import { fileURLToPath } from "url"
import { readFileSync } from "fs"
import { STORAGE_PATH, AERIAL_API_URL } from "$env/static/private"
import { PUBLIC_APP_URL, PUBLIC_GOOGLE_OAUTH_CALLBACK_PATH } from "$env/static/public"
// import { platform as currentPlatform } from "os"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * @typedef {Object} GoogleClientSecret
 * 
 * @property {Object} web
 * @property {String} web.client_id
 * @property {String} web.project_id
 * @property {String} web.auth_uri
 * @property {String} web.token_uri
 * @property {String} web.auth_provider_x509_cert_url
 * @property {String} web.client_secret
 * @property {String[]} web.redirect_uris
 * @property {String[]} web.javascript_origins
 */

/**
 * Get google client secret from json file
 * 
 * @param {import('fs').PathOrFileDescriptor} path 
 * @returns {GoogleClientSecret} GoogleClientSecret
 */
function getGoogleClientSecret(path) {
    return JSON.parse(readFileSync(path))
}

export const storage_path = path.join(__dirname, `../../${STORAGE_PATH}`)
// export const google_client_secret = getGoogleClientSecret(path.join(__dirname, '../../client_secret.json'))
export const google_client_secret = getGoogleClientSecret('client_secret.json')
export const google_oauth_callback_path = PUBLIC_GOOGLE_OAUTH_CALLBACK_PATH
export const aerial_api_url = AERIAL_API_URL
export const GlobalOAuth2Client = Symbol.for('sveltekit.google.OAuth2Client')
export const app_url = PUBLIC_APP_URL
// export const env = process.env.NODE_ENV
// export const env = import.meta.env.MODE
// export const platform = currentPlatform()
