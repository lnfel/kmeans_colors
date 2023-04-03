import { json } from '@sveltejs/kit'
import { readFile } from "node:fs/promises"
import { saveDocFromBase64 } from "$lib/ghostprinter/print-job/doc.js"
import libreoffice, { defaultFlags } from '$lib/execa/libreoffice'
// import * as libmupdf from "../../../../node_modules/mupdf-js/dist/libmupdf.wasm"
// import libmupdfInit from "../../../../node_modules/mupdf-js/dist/libmupdf.wasm?init"
// import libmupdfInit from "/libmupdf.wasm?init"

// https://vitejs.dev/guide/features.html#webassembly
// libmupdfInit().then((libmupdf) => {
//     console.log('libmupdf: ', libmupdf)
// })

/**
 * https://wasmbyexample.dev/examples/hello-world/hello-world.assemblyscript.en-us.html
 * https://www.reddit.com/r/sveltejs/comments/vzf86d/sveltekit_with_webassembly_rust/
 * https://stackoverflow.com/questions/44444050/obtaining-javascript-import-object-entries-from-a-webassembly-wasm-module
 */
export const POST = async ({ request, locals, cookies, fetch }) => {
    const file = await request.json()
    // console.log('file: ', file)
    console.log('file name: ', file.name)
    console.log('file type: ', file.type)
    const base64 = file.url

    // Save document to disk
    const { name, filepath } = await saveDocFromBase64(base64)
    console.log('filepath: ', filepath)
    console.log('name: ', name)

    // Convert to pdf with libreoffice
    const flags = defaultFlags(filepath)
    const {stdout} = await libreoffice.exec(flags)
    console.log('stdout: ', stdout)

    // const pdfArrayBuffer = await readFile('/Users/pingsailor/Sites/kmeans_colors_js/storage/tmp/CV2vvN.pdf')
    const pdfArrayBuffer = await readFile(filepath.replace('.docx', '.pdf'))
    console.log('pdfArrayBuffer: ', pdfArrayBuffer)
    const base64PDF = `data:application/pdf;base64,${pdfArrayBuffer.toString('base64')}`
    console.log('base64PDF: ', `${base64PDF.substring(0, 50)}...`)

    // Convert pdf to png using mupdf
    // /Users/pingsailor/Sites/kmeans_colors_js/storage/tmp/CV2vvN.docx
    // const mupdf = await createMuPdf()
    // console.log('mupdf: ', mupdf)

    // const mupdf = await fetch('/libmupdf.wasm')
    // console.log('mupdf: ', mupdf)

    // let importObject = {}
    // const wasmArrayBuffer = await fetch('/libmupdf.wasm').then(response => response.arrayBuffer())
    // const wasmModule = await WebAssembly.compile(wasmArrayBuffer)
    // console.log('wasmModule: ', wasmModule)
    // for (let imp of WebAssembly.Module.imports(wasmModule)) {
    //     if (typeof importObject[imp.module] === "undefined") {
    //         importObject[imp.module] = {}
    //     }
    //     switch (imp.kind) {
    //         case "function": importObject[imp.module][imp.name] = () => {}; break;
    //         case "table": importObject[imp.module][imp.name] = new WebAssembly.Table({ initial: 0, element: "anyfunc" }); break;
    //         case "memory": importObject[imp.module][imp.name] = new WebAssembly.Memory({ initial: 12000, maximum: 32768 }); break;
    //         case "global": importObject[imp.module][imp.name] = 0; break;
    //     }
    // }
    // console.log('importObject: ', importObject)
    // const wasm = WebAssembly.instantiate(wasmArrayBuffer, importObject)
    // console.log('wasm: ', wasm)

    // const response = await WebAssembly.instantiateStreaming(fetch('/libmupdf.wasm'), importObject)
    // console.log('response: ', response)

    // console.log('libmupdf: ', libmupdf)

    return json({
        base64PDF,
        name
    })
}
