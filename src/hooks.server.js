import { readFile } from 'fs/promises'
import { SvelteGoogleAuthHook } from 'svelte-google-auth/server'
import client_secret from '../client_secret.json'
import { createHandler } from 'svelte-kit-bot-block'
import { sequence } from '@sveltejs/kit/hooks'
import { svelteHandleWSSStartup } from '$lib/websocket/index.js'
// import { cleanStorage, cleanLogs, cleanCronLogs } from '$lib/aerial/server/cron.js'
import { svelteHandleRabbitmqStartup } from '$lib/rabbitmq/index.js'
import { svelteHandleLuciaAuth } from '$lib/aerial/server/lucia.js'

/**
 * On dev, code on top level in hooks gets triggered only on first request
 * In production it gets triggered on app startup
 * https://github.com/sveltejs/kit/issues/927
 * 
 * Probably not the best idea, somehow this increases CPU usage of the server and eventually leads to crash
 */
// cleanLogs.start()
// cleanStorage.start()
// cleanCronLogs.start()

/**
 * Create a client_secret A.K.A. OAuth web client ID
 * https://support.google.com/workspacemigrate/answer/9222992?hl=en
 * After creating one, download the json file of the client_secret
 */
const svelteGoogleAuth = new SvelteGoogleAuthHook(client_secret.web)

/**
 * Handle bot requests
 * 
 * @type {import('@sveltejs/kit').Handle}
 */
const svelteHandleBotBlock = createHandler({
    log: false,
    block: true
})

/**
 * Handle OAuth
 * 
 * @type {import('@sveltejs/kit').Handle}
 */
async function svelteHandleAuth({ event, resolve }) {
    return await svelteGoogleAuth.handleAuth({ event, resolve })
}

/**
 * Handle CORS
 * 
 * https://dev.to/khromov/configure-cors-in-sveltekit-to-make-fetch-requests-to-your-api-routes-from-a-different-host-241k
 * 
 * @type {import('@sveltejs/kit').Handle}
 * @returns {import('@sveltejs/kit').MaybePromise<Response>}
 */
async function svelteHandleCors({ event, resolve }) {
    // Apply CORS header for API routes
    // console.log("API route: ", event.url.pathname.startsWith('/api'))
    // console.log("Quirrel route: ", event.url.pathname.startsWith('/quirrel'))
    if (event.url.pathname.startsWith('/api') || event.url.pathname.startsWith('/quirrel')) {
        // Required for CORS to work
        console.log("Request method: ", event.request.method)
        if (event.request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                }
            })
        }
    }

    const response = await resolve(event)
    if (event.url.pathname.startsWith('/api') || event.url.pathname.startsWith('/quirrel')) {
        response.headers.append('Access-Control-Allow-Origin', '*')
    }

    return response
}

/**
 * Version controlled static assets for automatic cache busting
 * 
 * Hash is generated based on file contents, making sure cache is busted for clients
 * when a change is pushed to deployment.
 * 
 * @type {import('@sveltejs/kit').Handle}
 * @returns {import('@sveltejs/kit').MaybePromise<Response>}
 */
async function staticAssetsVersion({ event, resolve }) {
    return await resolve(event, {
        transformPageChunk: /** @param {{ html: String, done: Boolean }} */ async ({ html }) => {
            const cssContent = await readFile('static/css/main.css', { encoding: 'utf8' })
            const fontContent = await readFile('static/css/font.css', { encoding: 'utf-8' })
            return html.replaceAll('/css/main.css', `/css/main.css?v=${tinySimpleHash(cssContent)}`)
                .replaceAll('/css/font.css', `/css/font.css?v=${tinySimpleHash(fontContent)}`)
        }
    })
}

/**
 * Tiny Simple hash by bryc
 * From the author of cyrb53
 * 
 * https://stackoverflow.com/a/52171480/12478479
 * https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
 * 
 * @param {String} s 
 * @returns {Number} Hashed number representation of the string
 */
function tinySimpleHash(s) { for(var i=0,h=9;i<s.length;) h = Math.imul(h^s.charCodeAt(i++), 9**9); return h^h >>> 9 }

export const handle = sequence(
    svelteHandleCors,
    svelteHandleBotBlock,
    // svelteHandleAuth,
    svelteHandleLuciaAuth,
    svelteHandleWSSStartup,
    svelteHandleRabbitmqStartup,
    staticAssetsVersion,
)
