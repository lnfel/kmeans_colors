import * as path from "path"
import { mkdir, mkdtemp } from 'node:fs/promises'
import { fileURLToPath } from "url"
import { writeFile, readFile } from 'node:fs/promises'
import { json, error } from '@sveltejs/kit'
import KmeansColors, { defaultFlags, hexToRgb, hexToCmyk } from '$lib/execa/kmeans-colors'
import {
    ImageMagick,
    MagickImage,
    initializeImageMagick,
    MagickReadSettings,
    MagickFormat,
    Magick,
} from '@imagemagick/magick-wasm'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const GET = async () => {
    return new Response('Hello')
}

/**
 * Handle Post request to /magick
 * 
 * https://kit.svelte.dev/docs/routing#server
 * 
 * @returns {Response} Response object
 */
export const POST = async ({ request, locals, cookies }) => {
    const formData = await request.formData()
    const files = formData.getAll('file')

    console.log('magick/pdf-to-image files: ', files)

    for (let i = 0; i < files.length; i++) {
        try {
            const buffer = Buffer.from(await files[i].arrayBuffer())
            const extension = files[i].type.replace('application/', '')
            const filename = `pdf-${i}`
            const tmpdir = `storage/tmp/`
            const filedir = `${tmpdir}${filename}`
            const filepath = `${filedir}.${extension}`
            await writeFile(filepath, buffer, { flag: 'w+' })

            const pdfPath = path.join(__dirname, `../../../../../${filepath}`)
            console.log('pdfPath: ', pdfPath)

            // initializeImageMagick().then(async () => {
            //     const magickFontPath = path.join(__dirname, `../../../../../static/font/Hack-Regular.ttf`)
            //     console.log('magickFontPath: ', magickFontPath)
            //     const magickFont = await readFile(magickFontPath)
            //     console.log('magickFont:', magickFont)

            //     Magick.addFont('Hack', new Uint8Array(magickFont))
            // })
            // ImageMagick.read(buffer)

            // console.log(assets)

            // console.log(Magick)

            return json({})
        } catch (error) {
            console.log('[API] magick/pdf-to-image: ', error)
        }
    }
}