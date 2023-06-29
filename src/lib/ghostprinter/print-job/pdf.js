import * as path from "path"
import { fileURLToPath } from "url"
import { writeFile, access, constants } from 'node:fs/promises'
// import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf"
import ShortUniqueId from "short-unique-id"
// import { createCanvas } from "canvas"
import KmeansColors, { defaultFlags, hexToRgb, hexToCmyk } from '$lib/execa/kmeans-colors.js'
// import { fromPath as pdf2picFromPath, fromBuffer as pdf2picFromBuffer } from "pdf2pic"
// import { createMuPdf } from "mupdf-js"
// import initMuPdf from "mupdf-js/dist/libmupdf"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Prepare Ghostprinter PDF
 * 
 * @param {Blob} blob PDF file blob
 * @param {String} filename Custom filename
 * @param {String} tempdir Custom temporary directory
 * @returns {Object} Ghostprinter PDF object
 */
export const prepare = async (blob, filename, tempdir) => {
    console.log('prepare')
    const extension = blob.type.replace('application/', '')
    const hash = new ShortUniqueId()()
    filename = filename ?? `pdf-${hash}`
    tempdir = tempdir ?? 'storage/tmp/'
    const filedir = `${tempdir}${filename}`
    const filepath = `${filedir}.${extension}`

    return {
        buffer: Buffer.from(await blob.arrayBuffer()),
        arrayBuffer: await blob.arrayBuffer(),
        extension,
        filename,
        tempdir,
        filedir,
        filepath,
        hash,
    }
}

/**
 * Generate preview for PDF
 * 
 * @param {ArrayBuffer|Uint8Array} arrayBuffer PDF file Blob ArrayBuffer or Uint8Array
 * @param {String} filedir 
 * @param {String} format 
 * @param {Number} scale 
 * @returns {Object} Images array in base64 and kmeans_colors array
 */
export const preview = async (arrayBuffer, filedir, format = 'image/png', scale = 0.1) => {
    console.log('preview')
    const images = await bufferToBase64(arrayBuffer)
    await saveToTemp(images, filedir)
    let kmeans_colors = []

    console.log('kmeansColors')
    for (let i = 0; i < images.length; i++) {
        const imagepath = path.join(__dirname, `../../../../${filedir}/page-${i}.png`)
        const color = await kmeansColors(imagepath)
        kmeans_colors = [...kmeans_colors, color]
    }

    return {
        images,
        kmeans_colors
    }
}

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

/**
 * Convert PDF pages into base64 images
 * 
 * Error: Setting up fake worker failed: "The "id" argument must be of type string. Received an instance of Object".
 * https://qiita.com/sengoku/items/20fe8984f972d9648b47
 * https://github.com/mozilla/pdf.js/blob/70fc30d97c619de0f2fcb51e67bfdb1a46922725/src/core/worker.js#L139
 * 
 * Wait for RenderTask completion
 * https://github.com/mozilla/pdf.js/issues/7718#issuecomment-1288668934
 * 
 * @param {ArrayBuffer|Uint8Array} arrayBuffer PDF file Blob ArrayBuffer or Uint8Array
 * @param {String} format Experimental Option for image format
 * @param {Number} scale Scale of width and height to be used
 * @returns {Promise<Array>} Images array in Base64
 */
export const bufferToBase64 = async (arrayBuffer, format = 'image/png', scale = 0.1) => {
    console.log('bufferToBase64')
    return new Promise(async (resolve, reject) => {
        try {
            const before = Date.now()

            let images = []
            const { pdf, pages, viewport } = await pdfJsDocument(arrayBuffer, scale)

            // PDFDocumentProxy page starts with 1
            for (let i = 1; i < pages; i++) {
                const canvas = createCanvas(viewport.width, viewport.height)
                const canvasContext = canvas.getContext('2d')
                const page = await pdf.getPage(i)

                const renderTask = page.render({
                    canvasContext,
                    viewport
                })
                await renderTask.promise.then(() => {
                    return images = [...images, canvas.toDataURL()]
                })
            }

            const after = Date.now()
            console.log(`bufferToBase64 done in ${Math.round((after - before) / 1000)}s`)

            resolve(images)
        } catch (error) {
            console.log(error)
            reject(error)
        }
    })
}

/**
 * Initialize PDF using Mozilla's PDF.js
 * 
 * @param {ArrayBuffer|Uint8Array} arrayBuffer PDF file Blob ArrayBuffer or Uint8Array
 * @param {Number} scale Scale of width and height to be used
 * @returns {Promise<Object>} pdfJsDocument object
 */
export const pdfJsDocument = async (arrayBuffer, scale = 0.1) => {
    console.log('pdfJsDocument')
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker'
    const loadingTask = pdfjsLib.getDocument(arrayBuffer)
    const pdf = await loadingTask.promise
    const firstPage = await pdf.getPage(1)

    return {
        pdf,
        pages: pdf._pdfInfo.numPages,
        viewport: firstPage.getViewport({ scale })
    }
}

/**
 * Save images to specified directory
 * 
 * @param {Array} images Array of images in Base64
 * @param {String} filedir Directory where to save the images
 * @returns {Promise<void>} void
 */
export const saveToTemp = async (images, filedir) => {
    console.log('saveToTemp')
    return new Promise((resolve, reject) => {
        try {
            images.forEach(async (image, index) => {
                const buffer = Buffer.from(image.replace('data:image/png;base64,', ''), 'base64')
                await writeFile(`${filedir}/page-${index}.png`, buffer, { flag: 'w+' })
                resolve()
            })
        } catch (error) {
            console.log(error)
            reject(error)
        }
    })
}

/**
 * Generate preview for PDF using pdf2pic API
 * 
 * https://github.com/yakovmeister/pdf2image#pdf2pic-api
 * DO NOT use bulk due to memory overload
 * .bulk(-1, isBase64)
 * 
 * @param {Object} GhostPrintPDF PDF object using @see{prepare} function
 * @returns {Object} Images array in base64 and kmeans_colors array
 */
export const pdf2pic = async (GhostPrintPDF) => {
    const pdfJsDocumentbefore = Date.now()
    const { pdf, pages, viewport } = await pdfJsDocument(GhostPrintPDF.arrayBuffer, 0.1)
    const pdfJsDocumentafter = Date.now()
    console.log(`pdfJsDocument done in ${Math.round((pdfJsDocumentafter - pdfJsDocumentbefore) / 1000)}s`)

    const options = {
        saveFilename: 'page',
        savePath: GhostPrintPDF.filedir,
        format: 'png',
        width: viewport.width,
        height: viewport.height
    }
    console.log('options: ', options)

    const isBase64 = true
    let images = []
    const pdf2pic = pdf2picFromBuffer(GhostPrintPDF.buffer, options)
    console.log('pdf2pic: ', pdf2pic)
    const pdf2picbefore = Date.now()
    for (let i = 1; i < pages; i++) {
        const image = await pdf2pic(i, isBase64)
        images = [...images, `data:image/png;base64,${image.base64}`]
    }
    const pdf2picafter = Date.now()
    console.log(`pdf2pic done in ${Math.round((pdf2picafter - pdf2picbefore) / 1000)}s`)

    // Test single instance
    // const image = await pdf2pic(1, isBase64)
    // images = [...images, `data:image/png;base64,${image.base64}`]

    const saveToTempbefore = Date.now()
    await saveToTemp(images, GhostPrintPDF.filedir)
    const saveToTempafter = Date.now()
    console.log(`saveToFolder done in ${Math.round((saveToTempafter - saveToTempbefore) / 1000)}s`)

    const kmeansColorsbefore = Date.now()
    let kmeans_colors = []

    console.log('kmeansColors')
    for (let i = 0; i < images.length; i++) {
        const imagepath = path.join(__dirname, `../../../../${GhostPrintPDF.filedir}/page-${i}.png`)
        const color = await kmeansColors(imagepath)
        kmeans_colors = [...kmeans_colors, color]
    }
    const kmeansColorsafter = Date.now()
    console.log(`kmeansColors done in ${Math.round((kmeansColorsafter - kmeansColorsbefore) / 1000)}s`)

    return {
        images,
        kmeans_colors
    }
}

export default {
    prepare,
    preview,
    kmeansColors,
    bufferToBase64,
    saveToTemp
}