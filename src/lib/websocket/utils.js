// import { parse } from 'url'
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
 * @type {Map<import('ws').Server<import('ws').WebSocket>, String>}
 */
export const wsClients = new Map()

export class WebSocketClients {
    constructor() {
        this.list = new Object()
        /** @type {String[]} */
        this.clientIds = new Array()
    }
    /**
     * Add websocket client to list
     * 
     * @param {String} id 
     * @param {import('ws').Server<import('ws').WebSocket} ws 
     */
    add(id, ws) {
        this.list[id] = ws
    }
    /**
     * Remove websocket client from list
     * 
     * @param {String} id 
     */
    remove(id) {
        delete this.list[id]
    }
    /**
     * Add client id tracking from client side
     * 
     * @param {String} id 
     */
    addId(id) {
        this.clientIds.push(id)
    }
    /**
     * Remove client id tracking from client side
     * 
     * @param {String} id 
     */
    removeId(id) {
        const index = this.clientIds.findIndex((clientId) => clientId === id)
        this.clientIds.splice(index, 1)
    }
}

export const websocketClients = new WebSocketClients()

/**
 * Handle http server upgrade
 * 
 * @param {import('http').IncomingMessage} request 
 * @param {import('stream').Duplex} sock
 * @param {Buffer} head
 * @returns {undefined}
 */
export const onHttpServerUpgrade = (request, sock, head) => {
    // const pathname = request.url ? parse(request.url).pathname : null
    const pathname = request.url ? new URL(request.url, request.headers.origin).pathname : null
    console.log('onHttpServerUpgrade pathname: ', pathname)
    if (pathname !== '/websocket') return

    /**
     * @type {import('ws').Server}
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
        /** @param {import('ws').WebSocket & { socketId?: String }} ws */
        (ws) => {
            ws.socketId = `ws_${new ShortUniqueId()()}`
            console.log(`${chalk.blueBright('[wss:global]')} Websocket client connected (${ws.socketId})`)
            wsClients.set(ws, { socketId: ws.socketId })
            websocketClients.add(ws.socketId, ws)
            console.log(`${chalk.blueBright('[wss:global]')} Client count (${wsClients.size})`)
            console.log(`${chalk.blueBright('[wss:global]')} websocketClients.list: `, Object.keys(websocketClients.list))

            ws.on('close', () => {
                console.log(`${chalk.blueBright('[wss:global]')} Websocket client disconnected (${ws.socketId})`)
                wsClients.delete(ws)
                websocketClients.remove(ws.socketId)
                delete globalThis[ws.socketId]
                console.log(`${chalk.blueBright('[wss:global]')} Client count (${wsClients.size})`)
                console.log(`${chalk.blueBright('[wss:global]')} websocketClients.list: `, Object.keys(websocketClients.list))
                console.log(`${chalk.blueBright('[wss:global]')} ${ws.socketId} removed: `, !globalThis.hasOwnProperty(ws.socketId))
            })

            ws.on('error', console.log)

            // Pass ws client to global instance so we can call it in quirrel endpoint
            globalThis[ws.socketId] = ws
        })

        return wss
    }
}
