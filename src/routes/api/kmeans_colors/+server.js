import { json } from '@sveltejs/kit'
import { saveFromBase64 } from "$lib/ghostprinter/print-job/image.js"
import { kmeansColors } from "$lib/ghostprinter/print-job/pdf.js"

/**
 * Handle Post request to /kmeans_colors
 * 
 * https://kit.svelte.dev/docs/routing#server
 * https://dev.to/imichaelowolabi/this-is-why-your-nodejs-application-is-slow-206j
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

    function colorAverage(total, length) {
        return parseInt(total) / length
    }

    let cmyk = {}
    cmyk['total'] = kmeans_colors.map((colorset) => {
        return colorset.map((color) => {
            return color.cmyk
        }).reduce((accumulator, cmyk) => {
            const accumulatorArray = accumulator.split(' ')
            const cmykArray = cmyk.split(' ')
            const c = parseInt(accumulatorArray[0], 10) + parseInt(cmykArray[0], 10)
            const m = parseInt(accumulatorArray[1], 10) + parseInt(cmykArray[1], 10)
            const y = parseInt(accumulatorArray[2], 10) + parseInt(cmykArray[2], 10)
            const k = parseInt(accumulatorArray[3], 10) + parseInt(cmykArray[3], 10)
            return `${c} ${m} ${y} ${k}`
        }, '0 0 0 0')
    })
    cmyk['whiteSpace'] = kmeans_colors.map((colorset) => {
        const whiteFilter = colorset.filter((color) => {
            return color.color === '#ffffff'
        })

        return parseFloat(whiteFilter[0]?.percentage ?? 0)
    })
    cmyk['coloredSpace'] = cmyk['whiteSpace'].map((whiteSpace) => {
        return 100 - whiteSpace
    })
    cmyk['summary'] = cmyk['total'].map((cmykString, index) => {
        return {
            c: (colorAverage(cmykString.split(' ')[0], kmeans_colors[index].length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100,
            m: (colorAverage(cmykString.split(' ')[1], kmeans_colors[index].length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100,
            y: (colorAverage(cmykString.split(' ')[2], kmeans_colors[index].length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100,
            k: (colorAverage(cmykString.split(' ')[3], kmeans_colors[index].length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100,
        }
    })

    return json({
        kmeans_colors,
        cmyk
    })
}