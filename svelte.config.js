// import adapterAuto from '@sveltejs/adapter-auto'
import adapterNode from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/kit/vite'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		// adapter: process.env.NODE_ENV === 'development'
        //     ? adapterAuto()
        //     : adapterNode(),
        adapter: adapterNode(),
        csrf: {
            // csrf.check_origin fails in dev mode
            // https://github.com/sveltejs/kit/issues/8026
            // checkOrigin: process.env.NODE_ENV === 'development' ? false : true
            checkOrigin: false
        },
        csp: {
            directives: {
                "default-src": [
                    'self'
                ],
                "connect-src": [
                    'self',
                    'data:',
                    'wss:',
                    'https://apis.google.com/',
                    'https://accounts.google.com/gsi/',
                    'https://filetools2.pdf24.org/'
                ],
                "frame-src": [
                    'self',
                    'https://accounts.google.com/gsi/',
                ],
                "script-src": [
                    'self',
                    'unsafe-eval',
                    'https://accounts.google.com/gsi/client',
                    'https://apis.google.com'
                ],
                "style-src": [
                    'self',
                    'unsafe-inline',
                    'https://accounts.google.com/gsi/style',
                ],
                "img-src": [
                    'self',
                    'data:',
                    'https://lh3.googleusercontent.com'
                ]
            }
        }
	},
    preprocess: vitePreprocess()
};

export default config;
