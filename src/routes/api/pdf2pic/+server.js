import { mkdir } from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'
import { json } from '@sveltejs/kit'
import { prepare, pdf2pic } from "../../../lib/ghostprinter/print-job/pdf.js"

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

            const data = await pdf2pic(GhostPrintPDF)
            return json(data)
        } catch (error) {
            console.log(error)
        }
    }
}