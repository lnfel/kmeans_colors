import * as path from "path"
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from "url"
import { writeFile } from 'node:fs/promises'
import { json } from '@sveltejs/kit'
import { prepare, mupdf } from "../../../lib/ghostprinter/print-job/pdf.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Handle Post request to /pdfjs
 * 
 * https://kit.svelte.dev/docs/routing#server
 * 
 * @returns {Response} Response object
 */
export const POST = async ({ request, locals, cookies }) => {
    const formData = await request.formData()
    const files = formData.getAll('file')

    console.log('pdfjs files: ', files)

    for (let i = 0; i < files.length; i++) {
        try {
            const GhostPrintPDF = await prepare(files[i])
            await writeFile(GhostPrintPDF.filepath, GhostPrintPDF.buffer, { flag: 'w+' })
            await mkdir(GhostPrintPDF.filedir, { recursive: true })

            const data = await mupdf(GhostPrintPDF)
            return json(data)
        } catch (error) {
            console.log(error)
        }
    }
}