import { building } from '$app/environment'
import { GlobalThisWSS } from '$lib/websocket/utils.js'
import { airy } from '$lib/aerial/hybrid/util.js'

let wssInitialized = false

/**
 * Start WebSocket Server
 */
const startupWebsocketServer = () => {
    if (wssInitialized) return;

    airy({ topic: 'wss', message: "Starting Websockets Server.", action: 'executing' })

    /**
     * @type {import('ws').Server<import('ws').WebSocket>}
     */
    const wss = globalThis[GlobalThisWSS]

    if (wss !== undefined) {
        wss.on('connection',
        /**
         * Callback
         * 
         * @param {import('ws').Server<import('ws').WebSocket} ws 
         * @param {import('http').IncomingMessage} request 
         */
        (ws, request) => {
            /**
             * This is where you can authenticate the client from the request
             * const session = await getSessionFromCookie(request.headers.cookie || '')
             * if (!session) ws.close(1008, 'User not authenticated')
             * ws.userId = session.userId
             */
            airy({ topic: 'wss', message: `Client connected (${ws.socketId}).` })

            ws.send(`Hello from SvelteKit ${new Date().toLocaleString()} (${ws.socketId})]`)

            ws.on('close', () => {
                console.log(`[wss:kit] client disconnected (${ws.socketId})`)
                airy({ topic: 'wss', message: `Client disconnected (${ws.socketId}).` })
            })
        })

        wssInitialized = true
    }
}

/**
 * WebSocket Server startup sveltekit handle hook
 * 
 * @type {import('@sveltejs/kit').Handle}
 * @returns {import('@sveltejs/kit').MaybePromise}
 */
export const svelteHandleWSSStartup = async ({ event, resolve }) => {
    startupWebsocketServer()
    // Skip WebSocket server when pre-rendering pages
    if (!building) {
        /**
         * @type {import('ws').Server<import('ws').WebSocket>}
         */
        const wss = globalThis[GlobalThisWSS]
        if (wss !== undefined) {
            event.locals.wss = wss
        }
    }

    /**
     * This thing is evil, it prevents quirrel job request to be handled/invoked by sveltekit
     */
    // const response = await resolve(event, {
    //     filterSerializedResponseHeaders: (name) => {
    //         return name === 'content-type'
    //     }
    // })

    const response = await resolve(event)

    return response
}

/**
 * Startup websockets only once
 * 
 * https://github.com/suhaildawood/SvelteKit-integrated-WebSocket/blob/main/src/hooks.server.ts
 * https://github.com/suhaildawood/SvelteKit-integrated-WebSocket/issues/2
 */
export const WSSStartupOnce = async () => {
    startupWebsocketServer()

    if (!building) {
        /**
         * @type {import('ws').Server<import('ws').WebSocket>}
         */
        const wss = globalThis[GlobalThisWSS]
    }
}
