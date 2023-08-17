import { building } from '$app/environment'
// import { serialize } from 'v8'
// import { WebSocket } from 'ws'
import { GlobalThisWSS, wsClients } from '$lib/websocket/utils.js'
import { airy } from '$lib/aerial/hybrid/util.js'

let wssInitialized = false

/**
 * Start WebSocket Server
 */
const startupWebsocketServer = () => {
    if (wssInitialized) return;

    /**
     * @type {import('ws').Server<import('ws').WebSocket>}
     */
    const wss = globalThis[GlobalThisWSS]

    if (wss !== undefined && wss.listenerCount('connection') < 2) {
        airy({ topic: 'wss', message: "Attaching listeners.", action: 'executing' })
        wss.on('connection',
        /**
         * This is run everytime a client connects
         * 
         * @param {import('ws').WebSocket} ws 
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

            /**
             * Currently no way to deserialize this on client side
             * Lead: https://gist.github.com/jonathanlurie/04fa6343e64f750d03072ac92584b5df
             * - BSON etc.
             */
            // ws.send(
            //     serialize({
            //         message: `Hello from SvelteKit ${new Date().toLocaleString()} (${socketId})`,
            //         clients: wsClients
            //     }),
            // )

            /**
             * This close listener fires when the said client disconnects.
             * NOTE: the close listener in createWSSGlobalInstance will fire first before this
             */
            ws.on('close', () => {
                airy({ topic: 'wss', message: `Client disconnected (${ws.socketId}).` })
            })
        })

        wssInitialized = true
        // console.log(wss.listenerCount('connection'))
    }
}

/**
 * WebSocket Server startup sveltekit handle hook
 * 
 * @type {import('@sveltejs/kit').Handle}
 * @returns {import('@sveltejs/kit').MaybePromise}
 */
export const svelteHandleWSSStartup = async ({ event, resolve }) => {
    airy({ topic: 'wss', message: "Running sveltekit wss hook.", action: 'executing' })

    startupWebsocketServer()
    // Skip WebSocket server when pre-rendering pages
    if (!building) {
        /**
         * @type {import('ws').Server}
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
         * @type {import('ws').Server}
         */
        const wss = globalThis[GlobalThisWSS]
    }
}
