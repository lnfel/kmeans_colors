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
	},
    preprocess: vitePreprocess()
};

export default config;
