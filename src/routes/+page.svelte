<script>
    import { enhance } from "$app/forms"
    import { page } from "$app/stores"
    import { invalidateAll } from "$app/navigation"
    import { createMuPdf } from "mupdf-js"

    import Logo from "$lib/component/Logo.svelte"
    import Pulse from "$lib/component/Pulse.svelte"
    import GoogleClient from "$lib/component/GoogleClient.svelte"
    import FileInput from "$lib/component/input/File.svelte"
    import Button from "$lib/component/Button.svelte"

    /**
     * How To Create A SvelteKit Image Upload (step-by-step)
     * https://www.programonaut.com/how-to-create-a-sveltekit-image-upload-step-by-step/
     */
    let fileinput, submitBtn, image, showImage = false
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
                    type: file.type,
                    size: file.size
                }
                // https://svelte.dev/tutorial/updating-arrays-and-objects
                images = [...images, image]
                resolve(images)
            })
        })
    }

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

    /**
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
     */
    async function onChange(event) {
        reset(false)
        const files = fileinput.files
        // const files = event.target.files
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

        console.log('onChange files: ', fileinput.files)

        if (files) {
            showImage = true
            submitBtn.disabled = false
            submitBtn.classList.remove('text-gray-500', 'border-gray-500')
            submitBtn.classList.add('text-rose-500', 'border-rose-500')

            Array.from(files).forEach(async (file) => {
                console.log('file: ', file)

                if (fileCheck.isImage(file.type)) {
                    promise = getBase64Image(file)
                }

                if (fileCheck.isPdf(file.type)) {
                    promise =  mupdfPreview(file)
                }

                if (fileCheck.isDoc(file.type)) {
                    promise = googleDrivePreview(file)
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
        showImage = false
        await invalidateAll()
        if (clearPreview) {
            const previewContainer = document.querySelector('.preview-container')
            console.log('previewContainer: ', previewContainer)
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
     * @param {File} file PDF file input
     * @returns {Promise<Array>} Array of images to render
     */
    const mupdfPreview = async (file) => {
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
                kmeans_colors = data.kmeans_colors ?? []
                cmyk = data.cmyk ?? null

                const after = performance.now()
                console.log(`mupdfPreview done in ${((after - before) / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}s`)
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
    const docPreview = async (file) => {
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
                kmeans_colors = data.kmeans_colors ?? []
                cmyk = data.cmyk ?? null

                const after = performance.now()
                console.log(`docPreview done in ${((after - before) / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}s`)
                resolve(images)
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
    const pdf24Preview = async (file) => {
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
                resolve(docPreview(file))
            }
        })
    }

    const googleDrivePreview = async (file) => {
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
                kmeans_colors = data.kmeans_colors ?? []
                cmyk = data.cmyk ?? null

                const after = performance.now()
                console.log(`googleDrivePreview done in ${((after - before) / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}s`)

                resolve(images)
            } catch (error) {
                console.log('Received error from google drive preview, running fallback to pdf24')
                console.log(error)
                resolve(pdf24Preview(file))
            }
        })
    }
</script>

<svelte:head>
    <title>Aerial | Extract dominant colors on image and document files</title>
    <link rel="alternate" hreflang="en" href="https://www-staging.pingsailor.com" />
    <link rel="canonical" href="https://www-staging.pingsailor.com"/>
</svelte:head>

<header class="flex items-center justify-between lg:px-[3rem]">
    <Logo />
    <GoogleClient data={$page.data} />
</header>

<main class="lg:px-[3rem]">
    <section>
        <form method="POST" use:enhance={upload} class="flex flex-wrap gap-4 py-4" enctype="multipart/form-data">
            <FileInput bind:ref={fileinput} on:change={onChange} label="Upload" id="file" name="file" multiple accept="image/*,.pdf,.docx,.doc" />

            <div class="flex items-end gap-2">
                <Button bind:ref={submitBtn} type="submit" id="submit" disabled="{!showImage}">
                    Submit
                </Button>
                <Button on:click={reset} type="reset" id="reset">
                    Reset
                </Button>
            </div>
        </form>

        <div class="space-y-4">
            {#await promise}
                <div class="grid place-items-center py-[3rem]">
                    <Pulse />
                </div>
                <div class="text-center">
                    Generating preview.
                </div>
            {:then images}
                <div class="preview-container space-y-4">
                    {#if images}
                        <div>Pages: {images?.length ?? 0}</div>
                    {/if}
                    {#each images ?? [] as preview, index}
                        <div class="grid place-items-center">
                            <figure class="space-y-2">
                                <img src={preview.url} alt={preview.name} class="mx-auto" />
                                <figcaption class="text-center">
                                    <div>Page {index + 1}</div>
                                    <div>{preview.name}</div>
                                </figcaption>
                            </figure>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                            <div class="py-4 space-y-4">
                                <div>
                                    <div>CMYK Total</div>
                                    <small>Each number stands for the sum of C, M, Y and K in respective order from left to right.</small>
                                </div>
                                <div class="cmyk-total">
                                    {$page.form?.cmyk.total[index] ?? cmyk.total[index]}
                                </div>

                                <div>
                                    <div>CMYK Summary</div>
                                    <div><small>Formula: ((cmyk total / non-white colors length) / 100) * (colored space / 100) * 100</small></div>
                                </div>
                                <div class="cmyk-summary grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div class="cyan group relative flex items-center gap-2">
                                        <div class="w-20 text-slate-700 bg-cyan-400 border border-slate-500 px-2 py-0.5">Cyan</div>
                                        <div class="value">{`${$page.form?.cmyk.summary[index].c.value ?? cmyk.summary[index].c.value}%`}</div>
                                        <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                            {$page.form?.cmyk.summary[index].c.formula ?? cmyk.summary[index].c.formula}
                                        </div>
                                    </div>
                                    <div class="magenta group relative flex items-center gap-2">
                                        <div class="w-20 bg-pink-600 text-white border border-slate-500 px-2 py-0.5">Magenta</div>
                                        <div class="value">{`${$page.form?.cmyk.summary[index].m.value ?? cmyk.summary[index].m.value}%`}</div>
                                        <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                            {$page.form?.cmyk.summary[index].m.formula ?? cmyk.summary[index].m.formula}
                                        </div>
                                    </div>
                                    <div class="yellow group relative flex items-center gap-2">
                                        <div class="w-20 text-slate-700 bg-yellow-300 border border-slate-500 px-2 py-0.5">Yellow</div>
                                        <div class="value">{`${$page.form?.cmyk.summary[index].y.value ?? cmyk.summary[index].y.value}%`}</div>
                                        <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                            {$page.form?.cmyk.summary[index].y.formula ?? cmyk.summary[index].y.formula}
                                        </div>
                                    </div>
                                    <div class="key group relative flex items-center gap-2">
                                        <div class="w-20 bg-black text-white border border-slate-500 px-2 py-0.5">Key</div>
                                        <div class="value">{`${$page.form?.cmyk.summary[index].k.value ?? cmyk.summary[index].k.value}%`}</div>
                                        <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                            {$page.form?.cmyk.summary[index].k.formula ?? cmyk.summary[index].k.formula}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div>Color Distribution</div>
                                    <ul>
                                        <li><small>*White space is percentage of cmyk 0 0 0 0 color range (close to white or #ffffff) found by kmeans_colors</small></li>
                                        <li><small>*Colored space is 100 - white space</small></li>
                                    </ul>
                                </div>
                                <div class="color-distribution grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div class="flex items-center gap-2">
                                        <div class="w-20 text-slate-700 bg-white border border-slate-500 px-2 py-0.5">White</div> {$page.form?.cmyk.whiteSpace[index] ?? cmyk.whiteSpace[index]}%
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
