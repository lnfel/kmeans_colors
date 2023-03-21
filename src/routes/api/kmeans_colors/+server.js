import { json } from '@sveltejs/kit'
import { saveFromBase64 } from "../../../lib/ghostprinter/print-job/image.js"
import { kmeansColors } from "../../../lib/ghostprinter/print-job/pdf.js"

/**
 * Handle Post request to /kmeans_colors
 * 
 * https://kit.svelte.dev/docs/routing#server
 * 
 * @returns {Response} Response object
 */
export const POST = async ({ request, locals, cookies }) => {
    const images = await request.json()
    const base64Images = images.map((image) => {
        return image.url
    })

    const filedir = await saveFromBase64(base64Images)

    let kmeans_colors = []
    for (let i = 0; i < images.length; i++) {
        const imagepath = `${filedir}/page-${i}.png`
        const color = await kmeansColors(imagepath)
        kmeans_colors = [...kmeans_colors, color]
    }

    return json({
        kmeans_colors
    })
}