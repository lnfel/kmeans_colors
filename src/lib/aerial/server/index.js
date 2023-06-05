import { writeFile, access, constants } from 'node:fs/promises'
import KmeansColors, { defaultFlags, hexToRgb, hexToCmyk } from '$lib/execa/kmeans-colors.js'

/**
 * Calculate dominant colors of image
 * 
 * NOTE:
 * We are doing access check to slow down reading of file
 * Without this, the code would read to fast than the image could even finish being created.
 * We did an async await before calling kmeansColors but it seems not enough
 * 
 * @param {String} imagepath Path to image on disk
 * @returns {Promise<Object>} KmeansColor object
 */
export const kmeansColors = async (imagepath) => {
    const flags = defaultFlags(imagepath)
    try {
        await access(imagepath, constants.R_OK | constants.W_OK)
    } catch (error) {
        console.log("Cannot access imagepath.")
        console.log(error)
        return error
    }
    const {stdout} = await KmeansColors.exec(flags)
    console.log('KmeansColors stdout: ', stdout)
    const kmeans = stdout.split('\n')
    const colors = kmeans[0].split(',')
    const percentage = kmeans[1].split(',')
    const color = colors.map((color, index) => {
        const hexstring = `#${color}`

        return {
            color: hexstring,
            hex: hexstring,
            rgb: hexToRgb(hexstring).join(' '),
            cmyk: hexToCmyk(hexstring),
            percentage: (percentage[index] * 100).toFixed(2)
        }
    })

    return color
}

function colorAverage(total, length) {
    return parseInt(total) / length
}

/**
 * Generate summary of CMYK with given single kmeans_colors set
 * 
 * For getting cmyk from multiple kmeans_colors sets see $lib/ghosprinter/print-job/cmyk.js implementation
 * 
 * @param {Array} kmeans_colors Array of dominant colors produced by kmeans_colors binary
 * @returns {Object} CMYK object
 */
export const summary = async (kmeans_colors = []) => {
    const cmyk = {}

    cmyk['total'] = kmeans_colors.map((color) => {
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

    cmyk['whiteSpace'] = parseFloat(kmeans_colors.filter((color) => {
        return color.cmyk === '0 0 0 0'
    })[0]?.percentage ?? 0)

    cmyk['coloredSpace'] = 100 - cmyk['whiteSpace']

    cmyk['summary'] = {
        c: {
            formula: `((${cmyk['total'].split(' ')[0]} / ${kmeans_colors.filter(color => color.cmyk !== '0 0 0 0 ').length}) / 100) * (${cmyk['coloredSpace']} / 100) * 100`,
            value: (colorAverage(cmyk['total'].split(' ')[0], kmeans_colors.filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'] / 100) * 100,
        },
        m: {
            formula: `((${cmyk['total'].split(' ')[1]} / ${kmeans_colors.filter(color => color.cmyk !== '0 0 0 0 ').length}) / 100) * (${cmyk['coloredSpace']} / 100) * 100`,
            value: (colorAverage(cmyk['total'].split(' ')[1], kmeans_colors.filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'] / 100) * 100,
        },
        y: {
            formula: `((${cmyk['total'].split(' ')[2]} / ${kmeans_colors.filter(color => color.cmyk !== '0 0 0 0 ').length}) / 100) * (${cmyk['coloredSpace']} / 100) * 100`,
            value: (colorAverage(cmyk['total'].split(' ')[2], kmeans_colors.filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'] / 100) * 100,
        },
        k: {
            formula: `((${cmyk['total'].split(' ')[3]} / ${kmeans_colors.filter(color => color.cmyk !== '0 0 0 0 ').length}) / 100) * (${cmyk['coloredSpace']} / 100) * 100`,
            value: (colorAverage(cmyk['total'].split(' ')[3], kmeans_colors.filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'] / 100) * 100,
        },
    }

    // cmyk['summary'] = cmyk['total'].map((cmykString, index) => {
    //     return {
    //         c: {
    //             formula: `((${cmykString.split(' ')[0]} / ${kmeans_colors.filter(color => color.cmyk !== '0 0 0 0').length}) / 100) * (${cmyk['coloredSpace']} / 100) * 100`,
    //             value: (colorAverage(cmykString.split(' ')[0], kmeans_colors.filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'] / 100) * 100,
    //         }
    //     }
    // })

    // cmyk['total'] = kmeans_colors.map((colorset) => {
    //     return colorset.map((color) => {
    //         return color.cmyk
    //     }).reduce((accumulator, cmyk) => {
    //         const accumulatorArray = accumulator.split(' ')
    //         const cmykArray = cmyk.split(' ')
    //         const c = parseInt(accumulatorArray[0], 10) + parseInt(cmykArray[0], 10)
    //         const m = parseInt(accumulatorArray[1], 10) + parseInt(cmykArray[1], 10)
    //         const y = parseInt(accumulatorArray[2], 10) + parseInt(cmykArray[2], 10)
    //         const k = parseInt(accumulatorArray[3], 10) + parseInt(cmykArray[3], 10)
    //         return `${c} ${m} ${y} ${k}`
    //     }, '0 0 0 0')
    // })
    // cmyk['whiteSpace'] = kmeans_colors.map((colorset) => {
    //     const whiteFilter = colorset.filter((color) => {
    //         return color.cmyk === '0 0 0 0'
    //     })

    //     return parseFloat(whiteFilter[0]?.percentage ?? 0)
    // })
    // cmyk['coloredSpace'] = cmyk['whiteSpace'].map((whiteSpace) => {
    //     return 100 - whiteSpace
    // })
    // cmyk['summary'] = cmyk['total'].map((cmykString, index) => {
    //     return {
    //         c: {
    //             formula: `((${cmykString.split(' ')[0]} / ${kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length}) / 100) * (${cmyk['coloredSpace'][index]} / 100) * 100`,
    //             value: (colorAverage(cmykString.split(' ')[0], kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100,
    //         },
    //         m: {
    //             formula: `((${cmykString.split(' ')[1]} / ${kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length}) / 100) * (${cmyk['coloredSpace'][index]} / 100) * 100`,
    //             value: (colorAverage(cmykString.split(' ')[1], kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100,
    //         },
    //         y: {
    //             formula: `((${cmykString.split(' ')[2]} / ${kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length}) / 100) * (${cmyk['coloredSpace'][index]} / 100) * 100`,
    //             value: (colorAverage(cmykString.split(' ')[2], kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100,
    //         },
    //         k: {
    //             formula: `((${cmykString.split(' ')[3]} / ${kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length}) / 100) * (${cmyk['coloredSpace'][index]} / 100) * 100`,
    //             value: (colorAverage(cmykString.split(' ')[3], kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100,
    //         },
    //     }
    // })

    return cmyk
}

export default {
    summary,
}
