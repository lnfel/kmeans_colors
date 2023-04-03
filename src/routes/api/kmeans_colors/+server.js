import { json } from '@sveltejs/kit'
import { saveFromBase64 } from "$lib/ghostprinter/print-job/image.js"
import { kmeansColors } from "$lib/ghostprinter/print-job/pdf.js"
import { summary } from '$lib/ghostprinter/print-job/cmyk.js'

/**
 * Handle Post request to /kmeans_colors
 * 
 * https://kit.svelte.dev/docs/routing#server
 * https://dev.to/imichaelowolabi/this-is-why-your-nodejs-application-is-slow-206j
 * 
 * @returns {Response} Response object
 */
export const POST = async ({ request, locals, cookies }) => {
    const { name, images } = await request.json()
    const base64Images = images.map((image) => {
        return image.url
    })

    const filedir = await saveFromBase64(base64Images, name)

    let kmeans_colors = []

    /**
     * The Promise optimization is not applicable since running all promises
     * in parallel results in processing images beyond page 1, which results
     * in timing issue with the following error:
     * 
     * Format error decoding Png: Unexpected end of data before image end.
     */
    // const before = Date.now()
    // const kmeansColorsPromise = base64Images.map((image, index) => {
    //     const imagepath = `${filedir}/page-${index}.png`
    //     return kmeansColors(imagepath).then((color) => {
    //         return color
    //     })
    // })

    // const kmeans_colors = await Promise.all(kmeansColorsPromise)
    // const after = Date.now()
    // console.log(`kmeansColors Promise all done in ${(after - before) / 1000} s`)

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