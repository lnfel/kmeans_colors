import { parse } from 'url'
import { WebSocketServer } from 'ws'
import ShortUniqueId from "short-unique-id"
import chalk from 'chalk'

/**
 * First class support for websockets on sveltekit
 * https://github.com/suhaildawood/SvelteKit-integrated-WebSocket
 */

/**
 * Global WebSocket Server symbol
 * 
 * @type {Symbol}
 * @global
 */
export const GlobalThisWSS = Symbol.for('sveltekit.wss')

/**
 * Websocket clients
 * 
 * In case we want to monitor connected clients
 * 
 * https://ably.com/blog/web-app-websockets-nodejs
 * 
 * @type {Map}
 */
export const wsClients = new Map()

/**
 * Handle http server upgrade
 * 
 * @param {import('http').IncomingMessage} request 
 * @param {import('stream').Duplex} sock
 * @param {Buffer} head
 * @returns {undefined}
 */
export const onHttpServerUpgrade = (request, sock, head) => {
    const pathname = request.url ? parse(request.url).pathname : null
    console.log('onHttpServerUpgrade pathname: ', pathname)
    if (pathname !== '/websocket/') return

    /**
     * @type {import('ws').Server<import('ws').WebSocket>}
     */
    const wss = globalThis[GlobalThisWSS]
    wss.handleUpgrade(request, sock, head, (ws, request) => {
        console.log(`${chalk.blueBright('[wss]')} ${chalk.yellowBright('Creating new websocket connection.')}`)
        wss.emit('connection', ws, request)
    })
}

/**
 * Create WebSocket Server global instance
 * 
 * @param {import('ws').ServerOptions} [options] ServerOptions
 * @returns {import('ws').WebSocket.Server} WebSocket.Server
 */
export const createWSSGlobalInstance = (options = {}) => {
    /** @type {import('ws').Server<import('ws').WebSocket>} */
    // const wss = new WebSocketServer({ noServer: true })
    if (!globalThis[GlobalThisWSS]) {
        /** @type {import('ws').ServerOptions} */
        const defaultServerOptions = {
            // port: 8080,
            // host: '0.0.0.0',
            noServer: true
        }
        const wss = new WebSocketServer(Object.assign(defaultServerOptions, options))
        globalThis[GlobalThisWSS] = wss

        wss.on('connection',
        /** @param {import('ws').Server<import('ws').WebSocket} ws */
        (ws) => {
            ws.socketId = `ws_${new ShortUniqueId()()}`
            console.log(`${chalk.blueBright('[wss:global]')} Websocket client connected (${ws.socketId})`)
            wsClients.set(ws, { socketId: ws.socketId })
            console.log(`${chalk.blueBright('[wss:global]')} Client count (${wsClients.size})`)

            ws.on('close', () => {
                console.log(`${chalk.blueBright('[wss:global]')} Websocket client disconnected (${ws.socketId})`)
                wsClients.delete(ws)
                console.log(`${chalk.blueBright('[wss:global]')} Client count (${wsClients.size})`)
            })

            ws.on('error', console.log)
        })

        return wss
    }
}
