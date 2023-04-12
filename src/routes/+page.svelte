<script>
    import { enhance } from "$app/forms"
    import { page } from "$app/stores"
    import { invalidateAll } from "$app/navigation"
    import { createMuPdf } from "mupdf-js"

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
                    // promise = docPreview(file)

                    // promise = pdf24Preview(file)

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
                // const before = Date.now()
                const before = performance.now()
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
                    body: JSON.stringify({
                        images
                    })
                })
                const data = await response.json()
                kmeans_colors = data.kmeans_colors ?? []
                cmyk = data.cmyk ?? null

                // const after = Date.now()
                const after = performance.now()
                // console.log(`mupdfPreview done in ${Math.round((after - before) / 1000)}s`)
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
                // console.log('docData: ', docData)

                const fileBuffer = await fetch(docData.base64PDF)
                    .then(response => response.arrayBuffer())
                    .then(arrayBuffer => new Uint8Array(arrayBuffer))
                // console.log('fileBuffer: ', fileBuffer)
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
                // console.log('pdfArrayBuffer: ', pdfArrayBuffer)
                const pdfUi8 = new Uint8Array(pdfArrayBuffer)
                // console.log('pdfUi8: ', pdfUi8)
                const pdfRaw = [...pdfUi8]
                // console.log('pdfRaw: ', pdfRaw)
                const pdfBlob = new Blob([new Uint8Array(pdfRaw)], { type: 'application/pdf' })
                // console.log('pdfBlob: ', pdfBlob)
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
                // reject(error)
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
                // console.log('fileBuffer: ', fileBuffer)
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
</svelte:head>

<header class="flex items-center justify-between lg:px-[3rem]">
    <a href="/" class="logo group flex items-center text-indigo-500 dark:text-indigo-200 outline-none">
        <!-- generated using https://picsvg.com/ -->
        <!-- https://stackoverflow.com/questions/43744050/animated-light-reflection-on-image-in-css-or-jquery -->
        <svg class="logo-image group-hover:text-[#e4b124] group-focus:text-[#e4b124]" version="1.0" xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 300 223" preserveAspectRatio="xMidYMid meet">
            <defs>
                <!-- 
                    This is the base linearGradient, tried applying it on the <g> element
                    but the animation takes place on each path at the same time.
                    Animate linearGradient's gradientTransform attribute
                    using values from 1,0; (right) to -1,0; (left)
                    then we added dummy values of -1,0; (left) at the end of animation and set duration to 3s,
                    this will simulate delay on the animation
                -->
                <!-- <linearGradient id="logo-gradient" x1="0.07" y1="0.25" x2="0.93" y2="0.75" gradientTransform="translate(1,0)">
                    <stop offset="18%" stop-color="#e4b124"/>
                    <stop offset="49%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="#ffffff"/>
                    <stop offset="77%" stop-color="#e4b124"/>
                    <animateTransform id="lightReflection" attributeName="gradientTransform" type="translate" values="1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0;" dur="3s" fill="freeze" repeatCount="indefinite" />
                </linearGradient> -->
                <!--
                    Here we defined multiple linearGradient and added begin attribute for each
                    animateTransform to have a staggered effect. Apparently I haven't found any
                    way to do this without creating a bunch of similar linearGradient
                -->
                <linearGradient id="upper-right-gradient" x1="0.07" y1="0.25" x2="0.93" y2="0.75" gradientTransform="translate(1,0)">
                    <stop offset="18%" stop-color="#e4b124"/>
                    <stop offset="49%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="#ffffff"/>
                    <stop offset="77%" stop-color="#e4b124"/>
                    <animateTransform id="lightReflection" attributeName="gradientTransform" type="translate" values="1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0;" dur="3s" fill="freeze" repeatCount="indefinite" />
                </linearGradient>
                <linearGradient id="mid-trapezoid-gradient" x1="0.07" y1="0.25" x2="0.93" y2="0.75" gradientTransform="translate(1,0)">
                    <stop offset="18%" stop-color="#e4b124"/>
                    <stop offset="49%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="#ffffff"/>
                    <stop offset="77%" stop-color="#e4b124"/>
                    <animateTransform id="lightReflection" attributeName="gradientTransform" type="translate" values="1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0;" dur="3s" begin="0.1s" fill="freeze" repeatCount="indefinite" />
                </linearGradient>
                <linearGradient id="short-arc-gradient" x1="0.07" y1="0.25" x2="0.93" y2="0.75" gradientTransform="translate(1,0)">
                    <stop offset="18%" stop-color="#e4b124"/>
                    <stop offset="49%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="#ffffff"/>
                    <stop offset="77%" stop-color="#e4b124"/>
                    <animateTransform id="lightReflection" attributeName="gradientTransform" type="translate" values="1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0;" dur="3s" begin="0.2s" fill="freeze" repeatCount="indefinite" />
                </linearGradient>
                <linearGradient id="long-arc-gradient" x1="0.07" y1="0.25" x2="0.93" y2="0.75" gradientTransform="translate(1,0)">
                    <stop offset="18%" stop-color="#e4b124"/>
                    <stop offset="49%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="#ffffff"/>
                    <stop offset="77%" stop-color="#e4b124"/>
                    <animateTransform id="lightReflection" attributeName="gradientTransform" type="translate" values="1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0; -1,0;" dur="3s" begin="0.3s" fill="freeze" repeatCount="indefinite" />
                </linearGradient>
            </defs>
            <g fill="currentColor" transform="translate(0,223) scale(0.1,-0.1)" stroke="none">
                <path id="upper-right" d="M2474 1887 l-329 -263 -85 86 c-192 195 -402 283 -675 283 -107 0 -147 -5 -227 -26 -159 -42 -345 -152 -452 -266 l-30 -31 172 0 173 0 60 31 c91 45 196 69 309 69 194 0 358 -68 495 -205 l80 -80 -300 -5 -299 -5 -219 -280 c-120 -154 -220 -285 -223 -292 -5 -10 440 -593 451 -593 2 0 113 141 247 312 133 172 455 586 715 921 260 334 471 607 469 607 -2 0 -152 -118 -332 -263z"/>
                <path id="mid-trapezoid" d="M570 1430 c-22 -35 -29 -54 -22 -63 5 -6 59 -76 119 -153 l110 -142 144 185 c79 102 150 194 157 204 13 18 5 19 -231 19 l-245 0 -32 -50z"/>
                <path id="short-arc" d="M430 877 c0 -36 38 -163 70 -233 60 -133 188 -290 297 -365 l42 -30 61 76 c33 42 60 80 60 85 0 5 -15 18 -34 29 -54 34 -171 163 -209 232 -20 35 -48 101 -63 147 l-27 82 -99 0 c-95 0 -98 -1 -98 -23z"/>
                <path id="long-arc" d="M239 1433 c-47 -122 -73 -304 -66 -457 17 -342 176 -653 446 -869 l64 -51 39 44 c21 25 38 50 38 55 0 6 -16 21 -36 34 -58 40 -176 160 -227 232 -95 134 -164 305 -188 469 -15 104 -6 287 19 385 l17 70 -44 58 c-24 31 -46 57 -48 57 -2 0 -8 -12 -14 -27z"/>
            </g>
        </svg>
        <h1 class="logo-text text-3xl font-extrabold tracking-wide">Aerial</h1>
    </a>
    <GoogleClient data={$page.data} />
</header>

<main class="lg:px-[3rem]">
    <section>
        <form method="POST" use:enhance={upload} class="flex flex-wrap gap-4 py-4" enctype="multipart/form-data">
            <FileInput bind:ref={fileinput} on:change={onChange} label="Upload" id="file" name="file" multiple accept="image/*,.pdf,.docx,.doc" />
            <!-- <div>
                <input bind:this={fileinput} on:change={onChange} type="file" name="file" multiple accept="image/*,.pdf,.docx,.doc" />
            </div> -->

            <div class="flex items-end gap-2">
                <Button bind:ref={submitBtn} type="submit" id="submit" disabled="{!showImage}">
                    Submit
                </Button>
                <Button on:click={reset} type="reset" id="reset">
                    Reset
                </Button>
                <!-- <input bind:this={submitBtn} type="submit" value="Submit" class={showImage ? 'border rounded px-4 text-rose-500 border-rose-500' : 'border rounded px-4 text-gray-500 border-gray-500'} disabled /> -->
                <!-- <input on:click={reset} type="reset" value="Reset" class="border border-gray-500 rounded px-4"> -->
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
                                    <div><small>Formula: ((cmyk total / color length) / 100) * (colored space / 100) * 100</small></div>
                                </div>
                                <div class="cmyk-summary grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div class="cyan group relative flex items-center gap-2">
                                        <div class="w-20 text-slate-700 bg-cyan-400 border border-slate-500 px-2 py-0.5">Cyan</div>
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
                                        <div class="w-20 text-slate-700 bg-yellow-300 border border-slate-500 px-2 py-0.5">Yellow</div>
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
