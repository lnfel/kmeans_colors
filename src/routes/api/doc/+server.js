import { json } from '@sveltejs/kit'
import { readFile } from "node:fs/promises"
import { saveDocFromBase64 } from "$lib/ghostprinter/print-job/doc.js"
import libreoffice, { defaultFlags } from '$lib/execa/libreoffice'

/**
 * https://wasmbyexample.dev/examples/hello-world/hello-world.assemblyscript.en-us.html
 * https://www.reddit.com/r/sveltejs/comments/vzf86d/sveltekit_with_webassembly_rust/
 * https://stackoverflow.com/questions/44444050/obtaining-javascript-import-object-entries-from-a-webassembly-wasm-module
 */
export const POST = async ({ request, locals, cookies, fetch }) => {
    const file = await request.json()
    console.log('file name: ', file.name)
    console.log('file type: ', file.type)
    const base64 = file.url

    // Save document to disk
    const { name, filepath } = await saveDocFromBase64(base64)
    console.log('filepath: ', filepath)
    console.log('name: ', name)

    // Convert to pdf with libreoffice
    const flags = defaultFlags(filepath)
    const libreofficeExec = await libreoffice()
    const {stdout} = await libreofficeExec(flags)
    console.log('stdout: ', stdout)

    const pdfArrayBuffer = await readFile(filepath.replace('.docx', '.pdf'))
    console.log('pdfArrayBuffer: ', pdfArrayBuffer)
    const base64PDF = `data:application/pdf;base64,${pdfArrayBuffer.toString('base64')}`
    console.log('base64PDF: ', `${base64PDF.substring(0, 50)}...`)

    return json({
        base64PDF,
        name
    })
}
