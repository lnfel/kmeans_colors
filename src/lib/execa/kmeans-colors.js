import * as path from "path"
import { fileURLToPath } from "url"
import { execa } from 'execa'
import dargs from "dargs"

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
const defaultBinaryPath = path.join(__dirname, '../bin/kmeans_colors')

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
 * https://codepen.io/AudreyRBC/pen/MzmLYx?editors=0010
 * 
 * @param {String} rgb Color in rgb format
 * @returns {String} CMYK color string
 */
export const rgbToCmyk = (rgb) => {
    let b = 1
    let cmyk = []

    for (var i = 0; i < rgb.length; i++) {
        let color =  1 - ( rgb[i] / 255 )

        if	( color < b ) b = color
        if ( b === 1 ) color = 1
        else color = ( ( color - b ) / ( 1 - b ) ) * 100

        cmyk[i] = Math.round(color)
    }

    const cmykDigit = Math.round(b * 100)
    cmyk.push(cmykDigit)

    return cmyk.join(' ')
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