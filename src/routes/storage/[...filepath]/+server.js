import { error } from '@sveltejs/kit'
import { readFile } from 'fs/promises'
import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import sharp from 'sharp'
import { fileCheck } from '$lib/aerial/hybrid/validation.js'
import { storage_path } from '$lib/config.js'
import { airy } from '$lib/aerial/hybrid/util.js'

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
        // https://ss64.com/bash/file.html
        // https://nodejs.org/api/child_process.html
        // let mimetype
        // const file = spawn('file', ['--brief', '--mime-type', `storage/${params.filepath}`])
        // file.stdout.on('data', (data) => {
        //     mimetype = data
        //     airy({ message: `mimetype: ${data}`, label: '[resource]:' })
        // })
        // file.stderr.on('data', () => {
        //     console.log(`file stderr: ${data}`)
        // })
        // https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback
        const execPromise = promisify(exec)
        const { stdout: mimetype, stderr } = await execPromise(`file --brief --mime-type storage/${params.filepath}`)
        const fileBuffer = await readFile(path)
        if (mimetype) {
            if (fileCheck.isImage(mimetype.trim())) {
                const webpBuffer = await sharp(fileBuffer)
                    .toFormat('webp')
                    .toBuffer()

                return new Response(webpBuffer, {
                    headers: {
                        "Cache-Control": "max-age=604800, stale-while-revalidate=86400"
                    }
                })
            }

            if (fileCheck.isPdf(mimetype.trim()) || fileCheck.isDoc(mimetype.trim())) {
                return new Response(fileBuffer, {
                    headers: {
                        "Cache-Control": "max-age=604800, stale-while-revalidate=86400"
                    }
                })
            }
        }

        if (stderr) {
            throw Error(stderr)
        }
    } catch (errorDetail) {
        airy({ message: errorDetail.message, label: '[resource]:' })
        if (errorDetail.code !== 'ENOENT') {
            // file command is not available on the current platform/environment
            // TODO: consider supporting windows platform
            throw error(418, "Fool you fell for my trap, THUNDER CROSS SPLIT ATTACK!")
        }
        throw error(404, "Resource not found.")
    }
}