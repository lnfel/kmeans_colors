import * as path from 'path'
import * as url from 'url'
import { createWSSGlobalInstance, onHttpServerUpgrade } from './src/lib/websocket/utils.js'
import { rabbitCreateGlobalConnection } from './src/lib/rabbitmq/utils.js'
import 'dotenv/config'

/**
 * First class support for websockets on sveltekit
 * https://github.com/suhaildawood/SvelteKit-integrated-WebSocket
 * 
 * We run this in production like so:
 * ORIGIN=http://localhost:3000 PORT=3000 BODY_SIZE_LIMIT=0 node ./aerialProdServer.js
 * instead of the usual:
 * ORIGIN=http://localhost:3000 BODY_SIZE_LIMIT=0 node build/index.js
 */
const filename = url.fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// semi-colon is important here since we are using IIAF below
createWSSGlobalInstance();

// Rabbitmq connect
rabbitCreateGlobalConnection(process.env.RABBITMQ_CONNECTION_URL);


/**
 * Immediately invoked async function (IIAF)
 */
(async () => {
    const { server } = await import(path.resolve(dirname, './build/index.js'))
    server.server.on('upgrade', onHttpServerUpgrade)
})()
