import { error } from '@sveltejs/kit'
import { readFile } from 'fs/promises'
import sharp from 'sharp'
import { storage_path } from '$lib/config.js'

/**
 * Fetch uploaded static files, we can also implement resizing here
 * 
 * With this we no longer need to set vite config's server.fs.allow
 * 
 * https://medium.com/@monsieurlazar/sveltekit-fetch-user-generated-files-with-api-endpoint-ccc48c76ea68
 * 
 * Sveltekit rest params:
 * 
 * https://kit.svelte.dev/docs/advanced-routing#rest-parameters
 * 
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const GET = async ({ params, route }) => {
    try {
        const path = route.id
            // .replace('[id]', params.id)
            // .replace('[filename]', params.filename)
            .replace('/storage', storage_path)
            .replace('[...filepath]', params.filepath)
            // .replace(/^/, '.')
        const imageBuffer = await readFile(path)
        const webpBuffer = await sharp(imageBuffer)
            .toFormat('webp')
            .toBuffer()

        return new Response(webpBuffer, {
            headers: {
                "Cache-Control": "max-age=604800, stale-while-revalidate=86400"
            }
        })
        // return new Response(path)
    } catch (errorDetail) {
        throw error(404, "Resource not found.")
    }
}