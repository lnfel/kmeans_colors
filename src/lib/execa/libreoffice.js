import * as path from "path"
import { fileURLToPath } from "url"
import { execa } from 'execa'
import dargs from "dargs"
import { platform } from "os"
import { storage_path } from "$lib/config.js"

/**
 * libreoffice
 * https://help.libreoffice.org/latest/he/text/shared/guide/start_parameters.html
 * https://itslinuxfoss.com/install-libreoffice-ubuntu-22-04/
 * sudo apt-get install libreoffice
 * 
 * Latest version available on snap `snap info libreoffice`
 * https://www.libreoffice.org/download/snap/
 * sudo snap install libreoffice
 * 
 * Minimize startups of Libreoffice by running it as a service
 * https://github.com/unoconv/unoserver
 * https://github.com/gotenberg/gotenberg/issues/373
 * 
 * Gotenberg API
 * https://github.com/gotenberg/gotenberg
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
const supportedPlatforms = {
    'darwin': {
        libreofficePath: "/usr/local/bin/soffice"
    },
    'linux': {
        libreofficePath: "/usr/bin/libreoffice"
    }
}
const defaultBinaryPath = supportedPlatforms[platform()].libreofficePath

/**
 * Argument parser
 * 
 * @param {Object} flags Flag object to be used
 * @returns {Array} Array of flags
 */
const args = (flags = {}) =>
    [].concat(dargs(flags, { useEquals: false })).filter(Boolean)

/**
 * Create Libreoffice instance
 * 
 * @param {String} binaryPath Path to libreoffice binary executable
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
 * Build libreoffice flags
 * 
 * The following flags are enabled:
 * - convert-to and outdir
 * 
 * @param {String} docpath Path of document to be processed
 * @returns {Object} libreoffice command flags
 */
export const defaultFlags = (docpath) => {
    const isString = typeof docpath === 'string' || docpath instanceof String
    const isArray = Array.isArray(docpath)

    if (!isString && !isArray) {
        throw new TypeError('Image path must be a string or array of image path strings.')
    }

    if (isArray) {
        docpath = docpath.join(',')
    }

    return {
        headless: true,
        "convert-to": "pdf",
        outdir: `${storage_path}/tmp`,
        // outdir: path.join(__dirname, "../../../storage/tmp"),
        _: [docpath],
    }
}

export default await create(defaultBinaryPath)

// try {
//     const libreoffice = await create(defaultBinaryPath)
//     const docpath = path.join(__dirname, '../../../Resume - Dec2021.docx')
//     console.log('libreoffice: ', libreoffice)
//     console.log('docpath: ', docpath)
//     const flags = defaultFlags(docpath)
//     console.log('flags: ', flags)
//     console.log('args: ', args(flags))
//     const {stdout} = await libreoffice.exec(flags)
//     console.log('libreoffice exec: ', stdout)
// } catch (error) {
//     console.log(error)
// }
