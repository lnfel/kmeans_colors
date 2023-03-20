import * as path from "path"
import { mkdir, mkdtemp } from 'node:fs/promises'
import { fileURLToPath } from "url"
import { writeFile } from 'node:fs/promises'
import Pdf from "pdf-img-convert"
import { json, error } from '@sveltejs/kit'
import KmeansColors, { defaultFlags, hexToRgb, hexToCmyk } from '$lib/execa/kmeans-colors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
/**
 * Handle Post request to /pdf-to-image
 * 
 * https://kit.svelte.dev/docs/routing#server
 * 
 * @returns {Response} Response object
 */
export async function POST({ request, locals, cookies }) {
    const formData = await request.formData()
    const files = formData.getAll('file')

    console.log('pdf-to-image files: ', files)

    for (let i = 0; i < files.length; i++) {
        try {
            const buffer = Buffer.from(await files[i].arrayBuffer())
            const extension = files[i].type.replace('application/', '')
            const filename = `pdf-${i}`
            const tmpdir = `storage/tmp/`
            const filedir = `${tmpdir}${filename}`
            const filepath = `${filedir}.${extension}`
            await writeFile(filepath, buffer, { flag: 'w+' })

            const pdfPath = path.join(__dirname, `../../../${filepath}`)
            console.log('pdfPath: ', pdfPath)

            // Default output is array of Uint8Array(s)
            let pdfImages = await Pdf.convert(pdfPath, {
                page_numbers: [1],
                base64: true
            })
            const pdfImagesDir = await mkdir(filedir, { recursive: true })
            let kmeans_colors = []

            for (let i = 0; i < pdfImages.length; i++) {
                const buffer = Buffer.from(pdfImages[i], 'base64')
                await writeFile(`${filedir}/page-${i}.png`, buffer, { flag: 'w+' })

                // Compute dominant colors on the saved image
                const flags = defaultFlags(path.join(__dirname, `../../../${filedir}/page-${i}.png`))
                const {stdout} = await KmeansColors.exec(flags)
                console.log(stdout)

                let kmeans = stdout.split('\n')
                let colors = kmeans[0].split(',')
                let percentage = kmeans[1].split(',')
                let color = colors.map((color, index) => {
                    const hexstring = `#${color}`

                    return {
                        color: hexstring,
                        hex: hexstring,
                        rgb: hexToRgb(hexstring).join(' '),
                        cmyk: hexToCmyk(hexstring),
                        percentage: (percentage[index] * 100).toFixed(2)
                    }
                })

                kmeans_colors = [...kmeans_colors, color]
            }

            // for (let i = 0; i < pdfImages.length; i++) {
            //     const buffer = Buffer.from(pdfImages[i], 'base64')
            // }

            return json({
                // cannot expose node URL.createObjectURL in browser
                // preview: URL.createObjectURL(new Blob(pdfImages[i])),

                // https://stackoverflow.com/a/36183085/12478479
                preview: `data:${files[0].type};base64,${pdfImages[i]}`,
                kmeans_colors
            })
        } catch (error) {
            console.log('PDF to image: ', error)
        }
    }
}