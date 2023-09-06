import mupdf from 'mupdf'
import { google } from 'googleapis'
import { getOAuth2Client, isSignedIn } from 'svelte-google-auth'
import { writeFile, access, constants, readFile, stat } from 'node:fs/promises'
import KmeansColors, { defaultFlags, hexToRgb, hexToCmyk } from '$lib/execa/kmeans-colors.js'
import { searchAerialFolder, aerialFolderCreate, startResumableUpload } from '$lib/aerial/server/google/drive.js'
import { storage_path, GlobalOAuth2Client } from '$lib/config.js'
import { airy } from '$lib/aerial/hybrid/util.js'
import prisma from '$lib/prisma.js'

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
    const KmeansColorsExec = await KmeansColors()
    const {stdout} = await KmeansColorsExec(flags)
    // console.log('KmeansColors stdout: ', stdout)
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
 * When a page is blank (all white space) we have no colors
 * hence the formula becomes 0 / 0 which returns NaN
 * https://stackoverflow.com/questions/18838301/in-javascript-why-does-zero-divided-by-zero-return-nan-but-any-other-divided-b
 * 
 * No null coalescing shortcut for NaN related value
 * https://github.com/tc39/proposal-nullish-coalescing/issues/28
 * 
 * If number is equal to 0 we keep it, otherwise we limit the number
 * of digits after decimal point to two places
 */
function nanHelper(value) {
    const number = isNaN(value) ? 0 : value
    return number === 0 ? number : Number(number).toFixed(2)
}

/**
 * Generate summary of CMYK with given MULTIPLE kmeans_colors set
 * 
 * @param {Array} kmeans_colors Array of dominant colors produced by kmeans_colors binary
 * @returns {Object} CMYK object
 */
export const summary = async (kmeans_colors = []) => {
    const cmyk = {}

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
            return color.cmyk === '0 0 0 0'
        })

        return parseFloat(whiteFilter[0]?.percentage ?? 0).toFixed(2)
    })
    cmyk['coloredSpace'] = cmyk['whiteSpace'].map((whiteSpace) => {
        return Number(100 - whiteSpace).toFixed(2)
    })

    cmyk['summary'] = cmyk['total'].map((cmykString, index) => {
        return {
            c: {
                formula: `((${cmykString.split(' ')[0]} / ${kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length}) / 100) * (${cmyk['coloredSpace'][index]} / 100) * 100`,
                value: nanHelper((colorAverage(cmykString.split(' ')[0], kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100),
            },
            m: {
                formula: `((${cmykString.split(' ')[1]} / ${kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length}) / 100) * (${cmyk['coloredSpace'][index]} / 100) * 100`,
                value: nanHelper((colorAverage(cmykString.split(' ')[1], kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100),
            },
            y: {
                formula: `((${cmykString.split(' ')[2]} / ${kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length}) / 100) * (${cmyk['coloredSpace'][index]} / 100) * 100`,
                value: nanHelper((colorAverage(cmykString.split(' ')[2], kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100),
            },
            k: {
                formula: `((${cmykString.split(' ')[3]} / ${kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length}) / 100) * (${cmyk['coloredSpace'][index]} / 100) * 100`,
                value: nanHelper((colorAverage(cmykString.split(' ')[3], kmeans_colors[index].filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'][index] / 100) * 100),
            },
        }
    })

    return cmyk
}

/**
 * Generate summary of CMYK with given SINGLE kmeans_colors set
 * 
 * For getting cmyk from multiple kmeans_colors sets:
 * @see {summary}
 * 
 * @param {Array} kmeans_colors Array of dominant colors produced by kmeans_colors binary
 * @returns {Object} CMYK object
 */
export const summarySingleSet = async (kmeans_colors = []) => {
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
    })[0]?.percentage ?? 0).toFixed(2)

    cmyk['coloredSpace'] = Number(100 - cmyk['whiteSpace']).toFixed(2)

    cmyk['summary'] = {
        c: {
            formula: `((${cmyk['total'].split(' ')[0]} / ${kmeans_colors.filter(color => color.cmyk !== '0 0 0 0 ').length}) / 100) * (${cmyk['coloredSpace']} / 100) * 100`,
            value: nanHelper((colorAverage(cmyk['total'].split(' ')[0], kmeans_colors.filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'] / 100) * 100),
        },
        m: {
            formula: `((${cmyk['total'].split(' ')[1]} / ${kmeans_colors.filter(color => color.cmyk !== '0 0 0 0 ').length}) / 100) * (${cmyk['coloredSpace']} / 100) * 100`,
            value: nanHelper((colorAverage(cmyk['total'].split(' ')[1], kmeans_colors.filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'] / 100) * 100),
        },
        y: {
            formula: `((${cmyk['total'].split(' ')[2]} / ${kmeans_colors.filter(color => color.cmyk !== '0 0 0 0 ').length}) / 100) * (${cmyk['coloredSpace']} / 100) * 100`,
            value: nanHelper((colorAverage(cmyk['total'].split(' ')[2], kmeans_colors.filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'] / 100) * 100),
        },
        k: {
            formula: `((${cmyk['total'].split(' ')[3]} / ${kmeans_colors.filter(color => color.cmyk !== '0 0 0 0 ').length}) / 100) * (${cmyk['coloredSpace']} / 100) * 100`,
            value: nanHelper((colorAverage(cmyk['total'].split(' ')[3], kmeans_colors.filter(color => color.cmyk !== '0 0 0 0').length) / 100) * (cmyk['coloredSpace'] / 100) * 100),
        },
    }

    return cmyk
}

/**
 * @typedef {Object} extractPdfColorsParams
 * @property {Buffer|undefined} pdfBuffer
 * @property {String} filepath - PDF filepath on disk
 * @property {'application/pdf'} mimetype - PDF mimetype
 * @property {import('@prisma/client').ArtifactCollection} artifactCollection
 * @property {import('@prisma/client').Artifact} artifact
 * @property {String} extension - File extension to use for generated url
 */

/**
 * Extracts pdf colors and updates artifact with kmeans_colors and cmyk data
 * 
 * @param {extractPdfColorsParams} extractPdfColorsParams
 * @returns {Promise<void>}
 */
export const extractPdfColors = async ({ pdfBuffer, filepath, mimetype = 'application/pdf', artifactCollection, artifact, extension = '.pdf' }) => {
    const kmeans_colors = []

    /**
     * MuPDF WASM
     * https://mupdf.readthedocs.io/en/latest/mupdf-wasm.html
     * https://mupdf.readthedocs.io/en/latest/mupdf-js.html
     */
    // mupdf.ready.then(async () => {
        const before = performance.now()
        pdfBuffer = pdfBuffer ?? await readFile(filepath.replace('_1', ''))

        const mupdfDocument = mupdf.Document.openDocument(pdfBuffer, mimetype)
        const pages = mupdfDocument.countPages()
        airy({ topic: 'quirrel', message: mupdfDocument, label: 'MuPDF document:' })
        airy({ topic: 'quirrel', message: pages, label: 'MuPDF pages count:' })

        // Convert each page to png image and save to storage
        for (let i = 0; i < pages; i++) {
            const page = mupdfDocument.loadPage(i)
            // const pixmap = page.toPixmap(mupdf.Matrix.identity, mupdf.ColorSpace.DeviceRGB, false)
            const pixmap = page.toPixmap(mupdf.Matrix.scale(0.5, 0.5), mupdf.ColorSpace.DeviceRGB, false)
            // pixmap.setResolution(300, 300)
            await writeFile(`${storage_path}/aerial/${artifactCollection.id}/${artifact.id}_${i + 1}.png`, pixmap.asPNG(), { flag: 'w+' })
        }

        // Extract colors
        for (let i = 0; i < pages; i++) {
            const color = await kmeansColors(`${storage_path}/aerial/${artifactCollection.id}/${artifact.id}_${i + 1}.png`)
            kmeans_colors.push(color)
        }

        const kmeansColor = await prisma.kmeansColors.create({
            data: {
                artifactId: artifact.id,
                colors: kmeans_colors
            }
        })

        const cmykData = await summary(kmeansColor.colors)

        const cmyk = await prisma.cMYK.create({
            data: {
                artifactId: artifact.id,
                info: cmykData
            }
        })

        await prisma.artifact.update({
            where: {
                id: artifact.id
            },
            data: {
                url: `/storage/aerial/${artifactCollection.id}/${artifact.id}${extension}`,
                kmeansColorsId: kmeansColor.id,
                cmykId: cmyk.id,
                pages
            }
        })

        const after = performance.now()
        await airy({ topic: 'quirrel', message: `PDF color extraction done in ${((after - before) / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} s` })
        // https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-218.php
        await airy({ topic: 'quirrel', message: `${((1000 * pages) / (after - before)).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} page(s) processed per second` })
        await airy({ topic: 'quirrel', message: `${((30000 * pages) / (after - before)).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} page(s) processed per 30 seconds` })
    // })
}

/**
 * DocMimetypes - docx and doc only
 * @typedef {'application/vnd.openxmlformats-officedocument.wordprocessingml.document'|'application/msword'} DocMimetypes
 */

/**
 * @typedef {Object} GoogleDocToPdfParams
 * @property {String} filepath - Word document filepath on disk
 * @property {DocMimetypes} mimetype - Mimetype of the document
 * @property {import('@prisma/client').Artifact} artifact
 */

/**
 * Convert word document to base64 pdf string using google drive API
 * 
 * Huge credits to Tanaike
 * https://stackoverflow.com/users/7108653/tanaike
 * 
 * @param {GoogleDocToPdfParams} GoogleDocToPdfParams
 * @returns {Promise<{ base64PDF: String }>}
 */
export const googleDocToPdf = async ({ filepath, mimetype, artifact }) => {
    try {
        const split = 262144 // This is a sample chunk size. https://stackoverflow.com/a/73264129/12478479
        const docBuffer = await readFile(filepath.replace('_1', ''))
        const docSize = docBuffer.length
        const array = [...new Int8Array(docBuffer)]
        const chunks = [...Array(Math.ceil(array.length / split))].map((_) => Buffer.from(new Int8Array(array.splice(0, split))))

        const client = globalThis[GlobalOAuth2Client]
        // airy({ topic: 'quirrel', message: client, label: 'Client:' })

        const aerialFolder = await searchAerialFolder(client) ?? await aerialFolderCreate(client)
        airy({ topic: 'quirrel', message: aerialFolder, label: 'Aerial folder:' })

        const resumableHeaders = {
            "Authorization": `Bearer ${client.credentials.access_token}`,
            "X-Upload-Content-Type": mimetype,
            "X-Upload-Content-Length": (await stat(filepath.replace('_1', ''))).size,
            "Content-Type": "application/json; charset=UTF-8"
        }

        const resumableBody = JSON.stringify({
            name: artifact.label,
            // mimeType: file.type
            /**
             * explicitly assign google workspace document mimeType so we can perform
             * export operations with conversions
             */
            mimeType: 'application/vnd.google-apps.document',
            parents: [aerialFolder.id]
        })

        // Perform resumable upload, initial request
        const resumable = await startResumableUpload(resumableHeaders, resumableBody)
        airy({ topic: 'quirrel', message: resumable.headers.get('location'), label: 'Headers location:' })

        // Perform resumable upload, second part
        let start = 0
        let upload
        for (let i = 0; i < chunks.length; i++) {
            const end = start + chunks[i].length - 1
            upload = await fetch(resumable.headers.get('location'), {
                method: 'PUT',
                headers: {
                    "Content-Range": `bytes ${start}-${end}/${docSize}`
                },
                body: chunks[i]
            })
            start = end + 1
            if (upload?.data) {
                airy({ topic: 'quirrel', message: upload.data, label: 'Upload data:' })
            }
        }
        const uploadData = await upload.json()
        airy({ topic: 'quirrel', message: uploadData, label: 'uploadData:' })

        // Export docx to pdf
        const drive = google.drive({version: 'v3', auth: client})
        const exportResponse = await drive.files.export({
                fileId: uploadData.id,
                mimeType: 'application/pdf',
            }, {
                responseType: 'arraybuffer'
            })
        airy({ topic: 'quirrel', message: exportResponse.data, label: 'Export response data:' })

        const base64PDF = exportResponse.status === 200
            ? `data:application/pdf;base64,${Buffer.from(exportResponse.data).toString('base64')}`
            : ''

        return { base64PDF }
    } catch (error) {
        airy({ topic: 'quirrel', message: error, label: 'googleDocToPdf' })
        throw Error(error.message ?? error)
    }
}

export default {
    kmeansColors,
    summary,
    summarySingleSet,
    googleDocToPdf
}
