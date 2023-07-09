import { writable } from 'svelte/store'
import { createMuPdf } from "mupdf-js"
import { fileCheck } from '$lib/aerial/hybrid/validation.js'

export const error = writable()

/**
 * Convert DOCX to base64
 * 
 * @param {File} file Docx file input
 * @returns {Object} doc object
 */
async function getBase64Doc(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.addEventListener("load", function () {
            const doc = {
                url: reader.result,
                name: file.name,
                type: file.type,
                size: file.size
            }
            resolve(doc)
        })
    })
}

async function clearErrors() {
    error.set(null)
}

/**
 * Preview PDF using MuPDF wasm
 * 
 * Note: do not forget to copy libmupdf.wasm to public folder
 * cp node_modules/mupdf-js/dist/libmupdf.wasm static/libmupdf.wasm
 * 
 * https://github.com/andytango/mupdf-js/issues/8
 * 
 * @param {File} file PDF file input
 * @returns {Promise<Array>} Array of images to render
 */
export const mupdfPreview = async (file) => {
    return new Promise(async (resolve, reject) => {
        try {
            const before = performance.now()
            const mupdf = await createMuPdf()
            const fileArrayBuffer = await file.arrayBuffer()
            const fileBuffer = new Uint8Array(fileArrayBuffer)
            const pdf = mupdf.load(fileBuffer)
            const pages = mupdf.countPages(pdf)
            console.log("Pages: ", pages)
            const images = await mupdfGeneratePreviews(mupdf, pdf, file, pages)

            // Calculate dominant colors from generated images
            const response = await fetch('/api/kmeans_colors', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    images
                })
            })
            const data = await response.json()
            data.images = images

            const after = performance.now()
            console.log(`mupdfPreview done in ${((after - before) / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}s`)
            resolve(data)
        } catch (error) {
            console.log(error)
            reject(error)
        }
    })
}

/**
 * Isolate mupdf image generation to prevent Svelte from re-rendering
 * 
 * Honestly re-rendeing is inevitable
 * 
 * @param {import('mupdf-js').MuPdf.Instance} mupdf Object representing MuPdf.Instance from createMuPdf method
 * @param {import('mupdf-js').MuPdf.DocumentHandle} pdf Number representing MuPdf.DocumentHandle from MuPdf.Instance.load method
 * @param {File} file File from file input
 * @param {Number} pages Number of pages in the pdf file
 * @returns {Promise<Array>} Array of images to render
 */
async function mupdfGeneratePreviews(mupdf, pdf, file, pages) {
    return new Promise((resolve, reject) => {
        try {
            let preview = []
            for (let i = 1; i <= pages; i++) {
                const base64Image = mupdf.drawPageAsPNG(pdf, i, 10)
                const image = {
                    url: base64Image.replaceAll(/\n/g, ""),
                    name: file.name,
                    type: file.type
                }
                preview.push(image)
            }

            resolve(preview)
        } catch (error) {
            console.log(error)
            reject(error)
        }
    })
}

/**
 * Preview DOCX by converting the file from docx to pdf using Libreoffice
 * Then passing the pdf file to mupdf for further processing
 * 
 * Libreoffice command line usage guide
 * https://help.libreoffice.org/latest/he/text/shared/guide/start_parameters.html
 * 
 * @param {File} file Docx file input
 * @returns {Promise<Array>} Array of images to render
 */
export const libreofficePreview = async (file) => {
    return new Promise(async (resolve, reject) => {
        try {
            const before = performance.now()
            const doc = await getBase64Doc(file)
            console.log('doc base64: ', doc)
            // process document
            const docResponse = await fetch('/api/doc', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(doc)
            })
            const docData = await docResponse.json()

            const fileBuffer = await fetch(docData.base64PDF)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => new Uint8Array(arrayBuffer))
            const mupdf = await createMuPdf()
            const pdf = mupdf.load(fileBuffer)
            const pages = mupdf.countPages(pdf)
            console.log("Pages: ", pages)

            const images = await mupdfGeneratePreviews(mupdf, pdf, file, pages)
            
            // Calculate dominant colors from generated images
            const response = await fetch('/api/kmeans_colors', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    images,
                    name: docData.name
                })
            })
            const data = await response.json()
            data.images = images

            const after = performance.now()
            console.log(`docPreview done in ${((after - before) / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}s`)
            resolve(data)
        } catch (error) {
            console.log(error)
            reject(error)
        }
    })
}

/**
 * Preview DOCX by converting it to pdf using pdf24 convert service
 * Then passing the pdf to mupdf for further processing
 * 
 * Code reference here
 * https://github.com/customautosys/docx-to-pdf-axios
 * 
 * PDF24 service website
 * https://tools.pdf24.org/en/
 * 
 * @param {File} file Docx file input
 * @returns {Promise<Array>} Array of images to render
 */
export const pdf24Preview = async (file) => {
    return new Promise(async (resolve, reject) => {
        try {
            const before = performance.now()

            const formData = new FormData()
            formData.append('file', file, file.name)
            const upload = await fetch('https://filetools2.pdf24.org/client.php?action=upload', {
                method: 'POST',
                body: formData,
            })
            if (!upload.ok) {
                throw new Error('Cannot upload docx on pdf24.')
            }
            const uploadData = await upload.json()
            console.log('uploadData: ', uploadData)

            const convert = await fetch('https://filetools2.pdf24.org/client.php?action=convertToPdf', {
                method: 'POST',
                body: JSON.stringify({
                    files: uploadData
                }),
                // body: JSON.stringify({
                //     files: [{"file":"upload_a68e939918637ea26097e92337d8563f.docx","size":4688445,"name":"Resume - Dec2021 copy.docx","ctime":"2023-04-05 03:42:12","host":"filetools2.pdf24.org"}]
                // }),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (!convert.ok) {
                throw new Error('Cannot convert docx on pdf24.')
            }
            const convertData = await convert.json()
            console.log('convertData: ', convertData)

            // Test uploaded data, so we don't spam upload endpoint
            // const convertDataProxy = {
            //     jobId: "convertToPdf_172e8d4bd15c4af5c47cf4878fe486de"
            // }

            // let jobStatus = await fetch(`https://filetools2.pdf24.org/client.php?action=getStatus&jobId=${convertDataProxy.jobId}`)
            let jobStatus = await fetch(`https://filetools2.pdf24.org/client.php?action=getStatus&jobId=${convertData.jobId}`)
            if (!jobStatus.ok) {
                throw new Error(`Cannot find job for docx on pdf24 with id of ${convertData.jobId}.`)
            }
            let jobStatusData = await jobStatus.json()
            console.log('jobStatusData initial response: ', jobStatusData)

            while (jobStatusData.status !== 'done') {
                try {
                    await new Promise((resolve, reject) => {
                        setTimeout(resolve, 2000)
                    })
                    // jobStatus = await fetch(`https://filetools2.pdf24.org/client.php?action=getStatus&jobId=${convertDataProxy.jobId}`)
                    jobStatus = await fetch(`https://filetools2.pdf24.org/client.php?action=getStatus&jobId=${convertData.jobId}`)
                    jobStatusData = await jobStatus.json()
                } catch (error) {
                    console.log(error)
                }
            }

            console.log('jobStatusData after while: ', jobStatusData)

            // const pdf = await fetch(`https://filetools2.pdf24.org/client.php?mode=download&action=downloadJobResult&jobId=${convertDataProxy.jobId}`)
            const pdf = await fetch(`https://filetools2.pdf24.org/client.php?mode=download&action=downloadJobResult&jobId=${convertData.jobId}`)
            // https://yahone-chow.medium.com/file-blob-arraybuffer-576a8e99de0d
            const pdfArrayBuffer = await pdf.arrayBuffer()
            const pdfUi8 = new Uint8Array(pdfArrayBuffer)
            const pdfRaw = [...pdfUi8]
            const pdfBlob = new Blob([new Uint8Array(pdfRaw)], { type: 'application/pdf' })
            // We are returning the input name which ends with .docx but in reality it is pdf format
            const pdfFile = new File([pdfBlob], jobStatusData.job['0.in.name'], {
                type: 'application/pdf'
            })
            console.log('pdfFile: ', pdfFile)
            const after = performance.now()
            console.log(`docx to pdf done in ${((after - before) / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}s`)

            resolve(mupdfPreview(pdfFile))
        } catch (error) {
            console.log('Received error from pdf24, running fallback with libreoffice')
            console.log(error)
            resolve(libreofficePreview(file))
        }
    })
}

/**
 * Preview DOCX by converting it to pdf using google drive api
 * Then passing the pdf to mupdf for further processing
 * 
 * @param {File} file Docx file input
 * @param {Object} $page Sveltekit PageData https://kit.svelte.dev/docs/types#app-pagedata
 * @returns {Promise<Array>} Array of images to render
 */
export const googleDrivePreview = async (file, $page) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!$page.data.auth.user) {
                throw new Error('Please sign in using google oauth first.')
            }

            const before = performance.now()

            const doc = await getBase64Doc(file)
            const driveResponse = await fetch('/api/google', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(doc)
            })
            const driveData = await driveResponse.json()
            console.log('driveData: ', driveData)

            const fileBuffer = await fetch(driveData.base64PDF)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => new Uint8Array(arrayBuffer))
            const mupdf = await createMuPdf()
            const pdf = mupdf.load(fileBuffer)
            const pages = mupdf.countPages(pdf)
            console.log("Pages: ", pages)

            const images = await mupdfGeneratePreviews(mupdf, pdf, file, pages)

            // Calculate dominant colors from generated images
            const response = await fetch('/api/kmeans_colors', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    images
                })
            })
            const data = await response.json()
            data.images = images

            const after = performance.now()
            console.log(`googleDrivePreview done in ${((after - before) / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}s`)

            resolve(data)
        } catch (error) {
            console.log('Received error from google drive preview, running fallback to pdf24')
            console.log(error)
            resolve(pdf24Preview(file))
        }
    })
}

/**
 * Batch processing of images on server-side
 * The idea is to have the images processed by sharp so that we get all output as PNG
 * then process them with kmeans_colors in one go
 * 
 * @param {File} file Image file input
 */
export const imagePreview = async (files) => {
    const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
    })
}

/**
 * Validate file input
 * 
 * @param {HTMLInputElement} target
 * @returns {Promise<void>}
 */
export const validateFileInput = async ({ target }) => {
    await clearErrors()
    const files = Array.from(target.files)

    if (target.files.length > 5) {
        target.value = ''
        error.set(new Error('Can only upload 5 files at a time.'))
        return
    }

    const imageCount = files.filter((file) => fileCheck.isImage(file.type)).length
    const pdfCount = files.filter((file) => fileCheck.isPdf(file.type)).length
    const docxCount = files.filter((file) => fileCheck.isDoc(file.type)).length
    const acceptedFilesCount = imageCount + pdfCount + docxCount
    
    if (target.files.length !== acceptedFilesCount) {
        target.value = ''
        error.set(new Error('Aerial can only process png, jpeg, webp, gif, svg, tiff, docx and pdf files.'))
        return
    }
}

export default {
    mupdfPreview,
    libreofficePreview,
    pdf24Preview,
    googleDrivePreview,
    imagePreview,
    validateFileInput,
    error
}
