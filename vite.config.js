import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { searchForWorkspaceRoot } from 'vite'
import { rabbitCreateGlobalConnection } from './src/lib/rabbitmq/utils.js'

export default defineConfig({
	plugins: [
        sveltekit(),
        {
            name: 'integratedRabbitmqServer',
            configureServer(server) {
                rabbitCreateGlobalConnection()
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
