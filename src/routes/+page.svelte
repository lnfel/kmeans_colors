<script>
    import { enhance } from "$app/forms"
    import { page } from "$app/stores"
    import { invalidateAll } from "$app/navigation"
    import { createMuPdf, MuPdf } from "mupdf-js"

    import Pulse from "$lib/component/Pulse.svelte"

    /**
     * How To Create A SvelteKit Image Upload (step-by-step)
     * https://www.programonaut.com/how-to-create-a-sveltekit-image-upload-step-by-step/
     */
    let fileinput, submitBtn, image, showImage
    let images = [], promise
    let kmeans_colors = []
    let cmyk

    // SVG loaders
    // https://samherbert.net/svg-loaders/
    let loading = false

    async function getBase64Image(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.addEventListener("load", function () {
                const image = {
                    url: reader.result,
                    name: file.name,
                    type: file.type
                }
                // https://svelte.dev/tutorial/updating-arrays-and-objects
                images = [...images, image]
                resolve(images)
            })
        })
    }

    async function onChange() {
        reset(false)
        const files = fileinput.files
        const allowedFileTypes = {
            images: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml',],
            pdf: ['application/pdf'],
            doc: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
        }
        const fileCheck = {
            isImage: (type) => {
                return allowedFileTypes.images.includes(type)
            },
            isPdf: (type) => {
                return allowedFileTypes.pdf.includes(type)
            },
            isDoc: (type) => {
                return allowedFileTypes.doc.includes(type)
            }
        }
        // const allowedFileTypes = [
        //     // IMAGE TYPES
        //     'image/png', 'image/jpeg', 'image/jpg',
        //     'image/webp', 'image/svg+xml',
        //     // PDF
        //     'application/pdf',
        //     // DOCX and DOC
        //     'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'
        // ]

        console.log('onChange files: ', fileinput.files)

        if (files) {
            showImage = true
            submitBtn.disabled = false
            submitBtn.classList.remove('text-gray-500', 'border-gray-500')
            submitBtn.classList.add('text-rose-500', 'border-rose-500')

            Array.from(files).forEach(async (file) => {
                // const isPdf = file.type === 'application/pdf'
                console.log('file: ', file)

                // if (allowedFileTypes.includes(file.type) && !isPdf) {
                //     promise = getBase64Image(file)
                // } else {
                //     promise =  mupdfPreview(file)
                // }
                if (fileCheck.isImage(file.type)) {
                    promise = getBase64Image(file)
                }

                if (fileCheck.isPdf(file.type)) {
                    promise =  mupdfPreview(file)
                    // docPreview(file)
                }
                }
            })

            return
        }

        showImage = false
    }

    async function reset(clearPreview = true) {
        images = []
        kmeans_colors = []
        cmyk = null
        await invalidateAll()
        if (clearPreview) {
            const previewContainer = document.querySelector('.preview-container')
            if (previewContainer.parentNode) {
                previewContainer.parentNode.removeChild(previewContainer)
            }
        }
    }

    async function upload({ form, data, action, cancel }) {
        await invalidateAll()

        // https://developer.mozilla.org/en-US/docs/Web/API/FormData/entries
        // https://stackoverflow.com/questions/75112305/how-to-append-values-to-a-form-in-sveltekit
        let files = data.getAll('file')
        console.log('all files:', files)
        // Add filenames to files
        for (const file of files) {
            data.append('filenames', file.name)
        }

        return async ({ result, update }) => {
            // data returned from submitting form
            // can be accessed via $page.form
            console.log(result)

            submitBtn.disabled = true
            submitBtn.classList.add('text-gray-500', 'border-gray-500')
            submitBtn.classList.remove('text-rose-500', 'border-rose-500')

            await update()
        }
    }

    /**
     * Preview PDF using MuPDF wasm
     * 
     * Note: do not forget to copy libmupdf.wasm to public folder
     * cp node_modules/mupdf-js/dist/libmupdf.wasm static/libmupdf.wasm
     * 
     * https://github.com/andytango/mupdf-js/issues/8
     * 
     * @param {File} file
     * @returns {Promise<Array>}
     */
    const mupdfPreview = async (file) => {
        return new Promise(async (resolve, reject) => {
            try {
                loading = true
                const before = Date.now()
                const mupdf = await createMuPdf()
                // console.log('mupdf: ', mupdf)
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
                    body: JSON.stringify(images)
                })
                const data = await response.json()
                if (data) {
                    loading = false
                }
                kmeans_colors = data.kmeans_colors ?? []
                cmyk = data.cmyk ?? null

                const after = Date.now()
                console.log(`mupdfPreview done in ${Math.round((after - before) / 1000)}s`)
                resolve(images)
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
     * @param {MuPdf.Instance} mupdf Object representing MuPdf.Instance from createMuPdf method
     * @param {MuPdf.DocumentHandle} pdf Number representing MuPdf.DocumentHandle from MuPdf.Instance.load method
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
</script>

<main>
    <section>
        <form method="POST" use:enhance={upload} class="flex flex-wrap gap-4 px-[3rem] py-4" enctype="multipart/form-data">
            <div>
                <input bind:this={fileinput} on:change={onChange} type="file" name="file" multiple accept="image/*,.pdf" />
            </div>

            <input bind:this={submitBtn} type="submit" value="Submit" class={showImage ? 'border rounded px-4 text-rose-500 border-rose-500' : 'border rounded px-4 text-gray-500 border-gray-500'} disabled />
            <input on:click={reset} type="reset" value="Reset" class="border border-gray-500 rounded px-4">
        </form>

        <div class="space-y-4">
            {#await promise}
                <div class="grid place-items-center p-[3rem]">
                    <Pulse />
                </div>
                <div class="text-center px-[3rem]">
                    Generating preview.
                </div>
            {:then images}
                <div class="preview-container space-y-4">
                    <div class="px-[3rem]">Pages: {images?.length ?? 0}</div>
                    {#each images ?? [] as preview, index}
                        <div class="grid place-items-center px-[3rem]">
                            <figure class="space-y-2">
                                <img src={preview.url} alt={preview.name} class="mx-auto" />
                                <figcaption class="text-center">
                                    <div>Page {index + 1}</div>
                                    <div>{preview.name}</div>
                                </figcaption>
                            </figure>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 px-[3rem]">
                            {#each $page.form?.kmeans_colors[index] ?? kmeans_colors[index] ?? [] as pallete}
                                <div>
                                    <div style="background-color: {pallete.color}; border: 1px solid rgb(203 213 225);" class="p-4"></div>
                                    <div>Hex: { pallete.hex }</div>
                                    <div>RGB: { pallete.rgb }</div>
                                    <div>CMYK: { pallete.cmyk }</div>
                                    <div>{ pallete.percentage }%</div>
                                </div>
                            {/each}
                        </div>

                        {#if $page.form?.cmyk || cmyk}
                            <div class="px-[3rem] py-4 space-y-4">
                                <div>
                                    <div>CMYK Total</div>
                                    <small>Each number stands for the sum of C, M, Y and K in respective order from left to right.</small>
                                </div>
                                <div class="cmyk-total">
                                    {$page.form?.cmyk.total[index] ?? cmyk.total[index]}
                                </div>

                                <div>
                                    <div>CMYK Summary</div>
                                    <div><small>Formula: ((cmyk total / color length) / 100) * (colored space / 100) * 100</small></div>
                                </div>
                                <div class="cmyk-summary grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div class="cyan group relative flex items-center gap-2">
                                        <div class="w-20 bg-cyan-400 border border-slate-500 px-2 py-0.5">Cyan</div>
                                        <div class="value">{`${$page.form?.cmyk.summary[index].c.value ?? cmyk.summary[index].c.value}%`}</div>
                                        <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800">
                                            {$page.form?.cmyk.summary[index].c.formula ?? cmyk.summary[index].c.formula}
                                        </div>
                                    </div>
                                    <div class="magenta group relative flex items-center gap-2">
                                        <div class="w-20 bg-pink-600 text-white border border-slate-500 px-2 py-0.5">Magenta</div>
                                        <div class="value">{`${$page.form?.cmyk.summary[index].m.value ?? cmyk.summary[index].m.value}%`}</div>
                                        <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800">
                                            {$page.form?.cmyk.summary[index].m.formula ?? cmyk.summary[index].m.formula}
                                        </div>
                                    </div>
                                    <div class="yellow group relative flex items-center gap-2">
                                        <div class="w-20 bg-yellow-300 border border-slate-500 px-2 py-0.5">Yellow</div>
                                        <div class="value">{`${$page.form?.cmyk.summary[index].y.value ?? cmyk.summary[index].y.value}%`}</div>
                                        <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800">
                                            {$page.form?.cmyk.summary[index].y.formula ?? cmyk.summary[index].y.formula}
                                        </div>
                                    </div>
                                    <div class="key group relative flex items-center gap-2">
                                        <div class="w-20 bg-black text-white border border-slate-500 px-2 py-0.5">Key</div>
                                        <div class="value">{`${$page.form?.cmyk.summary[index].k.value ?? cmyk.summary[index].k.value}%`}</div>
                                        <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800">
                                            {$page.form?.cmyk.summary[index].k.formula ?? cmyk.summary[index].k.formula}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div>Color Distribution</div>
                                    <ul>
                                        <li><small>*White space is percentage of #ffffff color found by kmeans_colors</small></li>
                                        <li><small>*Colored space is 100 - white space</small></li>
                                    </ul>
                                </div>
                                <div class="color-distribution grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div class="flex items-center gap-2">
                                        <div class="w-20 bg-white border border-slate-500 px-2 py-0.5">White</div> {$page.form?.cmyk.whiteSpace[index] ?? cmyk.whiteSpace[index]}%
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-20 bg-gradient-to-br from-rose-500 via-violet-500 to-sky-500 text-white border border-slate-500 px-2 py-0.5">Colored</div> {$page.form?.cmyk.coloredSpace[index] ?? cmyk.coloredSpace[index]}%
                                    </div>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            {/await}
        </div>
    </section>
</main>

<style>
    img {
        max-width: 100%;
        max-height: 15rem;
        border: 1px solid rgb(203 213 225);
        border-radius: 0.5rem;
    }
</style>
