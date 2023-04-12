import { SvelteGoogleAuthHook } from 'svelte-google-auth/server'
import client_secret from '../client_secret.json'

/**
 * Create a client_secret A.K.A. OAuth web client ID
 * https://support.google.com/workspacemigrate/answer/9222992?hl=en
 * After creating one, download the json file of the client_secret
 */

const auth = new SvelteGoogleAuthHook(client_secret.web)

export const handle = async ({ event, resolve }) => {
    return await auth.handleAuth({ event, resolve })
}