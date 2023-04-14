import { SvelteGoogleAuthHook } from 'svelte-google-auth/server'
import client_secret from '../client_secret.json'
import { cleanStorage, cleanLogs, cleanCronLogs } from '$lib/aerial/server/cron'

/**
 * On dev, code on top level in hooks gets triggered only on first request
 * In production it gets triggered on app startup
 * https://github.com/sveltejs/kit/issues/927
 */
cleanLogs.start()
cleanStorage.start()
cleanCronLogs.start()

/**
 * Create a client_secret A.K.A. OAuth web client ID
 * https://support.google.com/workspacemigrate/answer/9222992?hl=en
 * After creating one, download the json file of the client_secret
 */

const auth = new SvelteGoogleAuthHook(client_secret.web)

export const handle = async ({ event, resolve }) => {
    return await auth.handleAuth({ event, resolve })
}
