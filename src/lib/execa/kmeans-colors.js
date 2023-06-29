import * as path from "path"
import { fileURLToPath } from "url"
import { execa } from 'execa'
import dargs from "dargs"
import { platform } from "os"

/**
 * kmeans_colors
 * k-means clustering library and binary to find dominant colors in images
 * https://github.com/okaneco/kmeans-colors
 * 
 * Code structure from youtube-dl-exec
 * A simple Node.js wrapper for youtube-dl/yt-dlp.
 * https://github.com/microlinkhq/youtube-dl-exec/blob/master/src/index.js
 * 
 * dargs
 * Convert an object of options into an array of command-line arguments
 * https://github.com/sindresorhus/dargs
 * 
 * execa
 * Process execution for humans
 * https://github.com/sindresorhus/execa
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const defaultBinaryPath = path.join(__dirname, `../bin/kmeans_colors${platform() === 'win32' ? '.exe' : ''}`)

/**
 * Argument parser
 * 
 * @param {Object} flags Flag object to be used
 * @returns {Array} Array of flags
 */
const args = (flags = {}) =>
    [].concat(dargs(flags, { useEquals: false })).filter(Boolean)

/**
 * Create KmeansColors instance
 * 
 * @param {String} binaryPath Path to kmeans_colors binary executable
 * @returns {Promise|Object} Object that contains exec property
 */
export const create = async (binaryPath) => {
    const fn = async (flags, options) =>
        await fn.exec(flags, options)

    fn.binaryPath = binaryPath
    
    fn.exec = async (flags, options) =>
        await execa(binaryPath, args(flags), options)

    return fn
}

/**
 * Build kmean_colors flags
 * 
 * The following flags are enabled:
 * - no-file, print, rgb, sort, pct and input
 * 
 * @param {String|Array} imagepath Path of image to be processed
 * @returns {Object} kmean_colors command flags
 */
export const defaultFlags = (imagepath) => {
    const isString = typeof imagepath === 'string' || imagepath instanceof String
    const isArray = Array.isArray(imagepath)

    if (!isString && !isArray) {
        throw new TypeError('Image path must be a string or array of image path strings.')
    }

    if (isArray) {
        imagepath = imagepath.join(',')
    }

    return {
        "no-file": true,
        print: true,
        rgb: true,
        sort: true,
        pct: true,
        input: imagepath,
    }
}

/**
 * Hex color to RGB
 * 
 * https://codepen.io/AudreyRBC/pen/MzmLYx?editors=0010
 * 
 * @param {String} hexstring Color in hex format
 * @returns {String} RGB color string
 */
export const hexToRgb = (hexstring) => {
    let rgb = hexstring.replace('#', '').match(/.{2}/g)

    for (let i = 0; i < rgb.length; i++) {
        rgb[i] = hexToInt(rgb[i])
    }

    return rgb
}

/**
 * RGB color to CMYK
 * 
 * The rgb to cmyk here is wrong:
 * https://codepen.io/AudreyRBC/pen/MzmLYx?editors=0010
 * 
 * Updated code is from:
 * https://www.w3schools.com/colors/colors_converter.asp
 * https://www.w3schools.com/lib/w3color.js
 * 
 * Article about rgb to cmyk formula:
 * https://wizlogo.com/hex-to-cmyk
 * 
 * @param {Array} rgb Array of rgb colors
 * @returns {String} CMYK color string
 */
export const rgbToCmyk = (rgb) => {
    let c, m, y, k

    // We first divide RGB values by 255 to change the range from 0 - 255 to 0 - 1
    const red = rgb[0] / 255
    const green = rgb[1] / 255
    const blue = rgb[2] / 255

    // Calculate the black key color K
    k = 1 - Math.max(red, green, blue)

    if (k == 1) {
        // console.log("Black is 100 percent.")
        c = 0
        m = 0
        y = 0
    } else {
        // console.log('There are other colors than black')
        c = (1 - red - k) / (1 - k)
        m = (1 - green - k) / (1 - k)
        y = (1 - blue - k) / (1 - k)
    }

    return `${toCmykString(c)} ${toCmykString(m)} ${toCmykString(y)} ${toCmykString(k)}`
}

/**
 * Convert CMYK decimal to string
 * 
 * @param {Number} value CMYK decimal value
 */
function toCmykString(value) {
    return Math.round(Number(value).toFixed(2) * 100)
}

/**
 * Hex color to CMYK
 * 
 * @param {String} hexstring Color in hex format
 * @returns {String} CMYK color string
 */
export const hexToCmyk = (hexstring) => {
    const rgb = hexToRgb(hexstring)
    return rgbToCmyk(rgb)
}

/**
 * Convert Hex string to integer representation
 * 
 * https://codepen.io/AudreyRBC/pen/MzmLYx?editors=0010
 * 
 * @param {String} hexstring 
 * @returns {Number} Number value of hex string
 */
const hexToInt = (hexstring) => {
    hexstring = (hexstring + '').replace(/[^a-f0-9]/gi, '')
    return parseInt(hexstring, 16)
}

export default await create(defaultBinaryPath)

// try {
//     const kmeanColors = await create(defaultBinaryPath)
//     const imagepath = path.join(__dirname, '../../../Kayaks - Joel Reynolds.jpeg')
//     const imagepaths = [
//         imagepath,
//         imagepath,
//         imagepath
//     ]
//     console.log('KmeansColors: ', kmeanColors)
//     const flags = defaultFlags(imagepath)
//     const {stdout} = await kmeanColors.exec(flags)
//     console.log('KmeansColors exec: ', stdout)
// } catch (error) {
//     console.log(error)
// }