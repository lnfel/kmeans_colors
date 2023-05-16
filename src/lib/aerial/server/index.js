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
