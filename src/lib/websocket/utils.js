import { parse } from 'url'
import { WebSocketServer } from 'ws'
import { nanoid } from 'nanoid'
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
    if (pathname !== '/websocket') return

    /**
     * @type {import('ws').Server<import('ws').WebSocket>}
     */
    const wss = globalThis[GlobalThisWSS]
    wss.handleUpgrade(request, sock, head, (ws) => {
        console.log(`${chalk.blueBright('[wss]')} ${chalk.yellowBright('Creating new websocket connection.')}`)
        wss.emit('connection', ws, request)
    })
}

/**
 * Create WebSocket Server global instance
 * 
 * @returns {import('ws').Server<import('ws').WebSocket>} wss
 */
export const createWSSGlobalInstance = () => {
    /**
     * @type {import('ws').Server<import('ws').WebSocket>}
     */
    const wss = new WebSocketServer({ noServer: true })
    globalThis[GlobalThisWSS] = wss

    wss.on('connection',
    /**
     * @param {import('ws').Server<import('ws').WebSocket} ws 
     */
    (ws) => {
        ws.socketId = nanoid()
        console.log(`${chalk.blueBright('[wss]')} Websocket client connected (${ws.socketId})`)
        wsClients.set(ws, { socketId: ws.socketId })
    })

    wss.on('close',
    /**
     * @param {import('ws').Server<import('ws').WebSocket} ws 
     */
    (ws) => {
        console.log(`${chalk.blueBright('[wss]')} Websocket client disconnected (${ws.socketId})`)
        wsClients.delete(ws)
    })

    return wss
}
