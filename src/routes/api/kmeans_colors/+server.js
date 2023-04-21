import { json } from '@sveltejs/kit'
import { saveFromBase64 } from "$lib/ghostprinter/print-job/image.js"
import { kmeansColors } from "$lib/ghostprinter/print-job/pdf.js"
import { summary } from '$lib/ghostprinter/print-job/cmyk.js'

/**
 * Handle Post request to /kmeans_colors
 * 
 * https://kit.svelte.dev/docs/routing#server
 * 
 * @returns {Response} Response object
 */
export const POST = async ({ request, locals, cookies }) => {
    const { name, images } = await request.json()
    const base64Images = images.map((image) => {
        return image.url
    })

    const filedir = await saveFromBase64(base64Images, name)
    console.log('filedir: ', filedir)

    let kmeans_colors = []

    const before = Date.now()
    for (let i = 0; i < images.length; i++) {
        const imagepath = `${filedir}/page-${i}.png`
        const color = await kmeansColors(imagepath)
        kmeans_colors = [...kmeans_colors, color]
    }
    const after = Date.now()
    console.log(`kmeansColors loop done in ${(after - before) / 1000} s`)

    const cmyk = await summary(kmeans_colors)
    console.log('cmyk: ', cmyk)

    return json({
        kmeans_colors,
        cmyk
    })
}