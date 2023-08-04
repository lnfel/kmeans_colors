import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { searchForWorkspaceRoot } from 'vite'
// import { Server } from 'socket.io'
import { createWSSGlobalInstance, onHttpServerUpgrade } from './src/lib/websocket/utils.js'
import { rabbitCreateGlobalConnection } from './src/lib/rabbitmq/utils.js'
import 'dotenv/config'

/**
 * Using WebSockets with SvelteKit
 * Step 1. Create vite plugin for websockets (for development)
 * https://joyofcode.xyz/using-websockets-with-sveltekit
 * 
 * config.kit.vite is deprecated so we need to move the code in vite.config.js
 * https://www.reddit.com/r/sveltejs/comments/vtu5ha/do_you_have_an_idea_to_install_and_create_a/
 */
// export const webSocketServer = {
//     name: 'webSocketServer',
//     // https://vitejs.dev/guide/api-plugin.html#configureserver
//     configureServer(server) {
//         const io = new Server(server.httpServer)

//         io.on('connection', (socket) => {
//             socket.emit('eventFromServer', 'Hello World!')
//         })
//     }
// }

export default defineConfig({
	plugins: [
        sveltekit(),
        {
            name: 'integratedWebsocketServer',
            /** @param {import('vite').ViteDevServer} server */
            configureServer(server) {
                createWSSGlobalInstance()
                server.httpServer?.on('upgrade', onHttpServerUpgrade)
            }
        },
        {
            name: 'integratedRabbitmqServer',
            /** @param {import('vite').ViteDevServer} server */
            configureServer(server) {
                rabbitCreateGlobalConnection(process.env.RABBITMQ_CONNECTION_URL)
            }
        }
    ],
	// https://github.com/bluwy/svelte-preprocess-import-assets
	// https://vitejs.dev/config/server-options.html#server-fs-allow
	server: {
		fs: {
			allow: [
                // We are now using /storage route endpoint for this
				// // search up for workspace root
                // searchForWorkspaceRoot(process.cwd()),
				// // your custom rules
                // './storage/aerial/**/*'
			]
		}
	}
});
