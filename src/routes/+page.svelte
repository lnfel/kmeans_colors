<script>
    import { onMount } from 'svelte'
    import { enhance } from "$app/forms"
    import { page } from "$app/stores"
    import { invalidateAll } from "$app/navigation"
    import { googleDrivePreview, mupdfPreview, libreofficePreview, pdf24Preview, imagePreview } from "$lib/aerial/client/index.js"
    import { fromArrayBuffer } from 'geotiff'

    import Header from "$lib/component/Header.svelte"
    import Pulse from "$lib/component/Pulse.svelte"
    import FileInput from "$lib/component/input/File.svelte"
    import Button from "$lib/component/Button.svelte"

    /**
     * How To Create A SvelteKit Image Upload (step-by-step)
     * https://www.programonaut.com/how-to-create-a-sveltekit-image-upload-step-by-step/
     */
    let fileinput, submitBtn, hasImage = false
    let images = [], promise
    let plotty

    onMount(async () => {
        plotty = await import('plotty')
    })

    /**
     * Get status of a promise
     * 
     * https://stackoverflow.com/a/35820220/12478479
     * 
     * @param {Promise} promise
     * @returns {String}
     */
    function promiseState(promise) {
        const t = {}
        return Promise.race([promise, t])
            .then(v => (v === t) ? 'pending' : 'fulfilled', () => 'rejected')
    }

    async function getBase64Image(file, index) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            console.log('getBase64Image file: ', file)
            file.type === 'image/tiff'
                ? reader.readAsArrayBuffer(file)
                : reader.readAsDataURL(file)

            reader.addEventListener("load", async function() {
                if (reader.result instanceof ArrayBuffer) {
                    const buffer = reader.result
                    console.log(buffer)
                    const tiff = await fromArrayBuffer(buffer)
                    console.log(tiff)
                    const tiffImage = await tiff.getImage()
                    console.log(tiffImage)
                    const data = await tiffImage.readRasters()
                    // const data = await tiffImage.readRGB()
                    // console.log(data)
                    // console.log(data[0])
                    const image = {
                        url: null,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: data[0],
                        canvasId: `plotty-${index}`,
                        tiffImage
                    }
                    images = [...images, image]
                    resolve({
                        images
                    })
                    // const fulfilled = await promiseState(promise)
                    // console.log('fulfilled: ', fulfilled)
                } else {
                    const image = {
                        url: reader.result,
                        name: file.name,
                        type: file.type,
                        size: file.size
                    }
                    // https://svelte.dev/tutorial/updating-arrays-and-objects
                    images = [...images, image]
                    resolve({
                        images
                    })
                }
            })
        })
    }

    function renderTiff(preview) {
        console.log('renderTiff preview: ', preview)
        console.log('plotty: ', plotty)
        const canvas = document.querySelector(`#${preview.canvasId}`)
        const plot = new plotty.plot({
            canvas,
            data: preview.data,
            width: preview.tiffImage.getWidth(),
            height: preview.tiffImage.getHeight(),
            domain: [0, 255],
            useWebGL: false
            // colorScale: "rainbow"
        })
        plot.render()
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
     */
    async function onChange(event) {
        reset(false)
        const files = fileinput.files
        // const files = event.target.files
        const allowedFileTypes = {
            images: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif', 'image/tiff'],
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
            Array.from(files).forEach(async (file, index) => {
                console.log('file: ', file)

                if (fileCheck.isImage(file.type)) {
                    promise = getBase64Image(file, index)
                    hasImage = true
                    // submitBtn.disabled = false
                    submitBtn.classList.remove('text-gray-500', 'border-gray-500')
                    submitBtn.classList.add('text-rose-500', 'border-rose-500')
                }

                if (fileCheck.isPdf(file.type)) {
                    promise =  mupdfPreview(file)
                }

                if (fileCheck.isDoc(file.type)) {
                    // promise = libreofficePreview(file)
                    // promise = pdf24Preview(file)
                    promise = googleDrivePreview(file, $page)
                }
            })

            return
        }

        hasImage = false
    }

    async function reset(clearPreview = true) {
        images = []
        hasImage = false
        await invalidateAll()
        if (clearPreview) {
            const previewContainer = document.querySelector('.preview-container')
            // console.log('previewContainer: ', previewContainer)
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

            hasImage = false
            // submitBtn.disabled = true
            submitBtn.classList.add('text-gray-500', 'border-gray-500')
            submitBtn.classList.remove('text-rose-500', 'border-rose-500')

            await update()
        }
    }
</script>

<svelte:head>
    <title>Aerial | Extract dominant colors on image and document files</title>
    <link rel="alternate" hreflang="en" href="https://www-staging.pingsailor.com" />
    <link rel="canonical" href="https://www-staging.pingsailor.com"/>
</svelte:head>

<Header />

<main class="lg:px-[3rem]">
    <section>
        <form method="POST" use:enhance={upload} class="flex flex-wrap gap-4 py-4" enctype="multipart/form-data">
            <FileInput bind:ref={fileinput} on:change={onChange} label="Upload" id="file" name="file" multiple accept="image/*,.pdf,.docx,.doc" />

            <div class="flex items-end gap-2">
                <Button bind:ref={submitBtn} type="submit" id="submit" disabled="{!hasImage}">
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
            {:then data}
                <div class="preview-container space-y-4">
                    {#if data?.images}
                        <div>Pages: {data.images?.length ?? 0}</div>
                    {/if}
                    {#each data?.images ?? [] as preview, index}
                        <div class="grid place-items-center">
                            <figure class="space-y-2">
                            {#if preview.url}
                                <img src={preview.url} alt={preview.name} class="img-preview mx-auto" />
                            {:else}
                                {#await promiseState(promise) then fulfilled} 
                                    {#if fulfilled === 'fulfilled'}
                                        <div class="hidden">{renderTiff(preview)}</div>
                                    {/if}
                                {/await}
                                <canvas id="plotty-{index}"></canvas>
                            {/if}
                                <figcaption class="text-center">
                                    <div>Page {index + 1}</div>
                                    <div>{preview.name}</div>
                                </figcaption>
                            </figure>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {#each $page.form?.kmeans_colors[index] ?? data?.kmeans_colors?.[index] ?? [] as pallete}
                                <div>
                                    <div style="background-color: {pallete.color}; border: 1px solid rgb(203 213 225);" class="p-4"></div>
                                    <div>Hex: { pallete.hex }</div>
                                    <div>RGB: { pallete.rgb }</div>
                                    <div>CMYK: { pallete.cmyk }</div>
                                    <div>{ pallete.percentage }%</div>
                                </div>
                            {/each}
                        </div>

                        {#if $page.form?.cmyk || data?.cmyk}
                            <div class="py-4 space-y-4">
                                <div>
                                    <div>CMYK Total</div>
                                    <small>Each number stands for the sum of C, M, Y and K in respective order from left to right.</small>
                                </div>
                                <div class="cmyk-total">
                                    {$page.form?.cmyk.total[index] ?? data?.cmyk.total[index]}
                                </div>

                                <div>
                                    <div>CMYK Summary</div>
                                    <div><small>Formula: ((cmyk total / non-white colors length) / 100) * (colored space / 100) * 100</small></div>
                                </div>
                                <div class="cmyk-summary grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div class="cyan group relative flex items-center gap-2">
                                        <div class="w-20 text-slate-700 bg-cyan-400 border border-slate-500 px-2 py-0.5">Cyan</div>
                                        <div class="value">{`${$page.form?.cmyk.summary[index].c.value ?? data?.cmyk.summary[index].c.value}%`}</div>
                                        <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                            {$page.form?.cmyk.summary[index].c.formula ?? data?.cmyk.summary[index].c.formula}
                                        </div>
                                    </div>
                                    <div class="magenta group relative flex items-center gap-2">
                                        <div class="w-20 bg-pink-600 text-white border border-slate-500 px-2 py-0.5">Magenta</div>
                                        <div class="value">{`${$page.form?.cmyk.summary[index].m.value ?? data?.cmyk.summary[index].m.value}%`}</div>
                                        <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                            {$page.form?.cmyk.summary[index].m.formula ?? data?.cmyk.summary[index].m.formula}
                                        </div>
                                    </div>
                                    <div class="yellow group relative flex items-center gap-2">
                                        <div class="w-20 text-slate-700 bg-yellow-300 border border-slate-500 px-2 py-0.5">Yellow</div>
                                        <div class="value">{`${$page.form?.cmyk.summary[index].y.value ?? data?.cmyk.summary[index].y.value}%`}</div>
                                        <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                            {$page.form?.cmyk.summary[index].y.formula ?? data?.cmyk.summary[index].y.formula}
                                        </div>
                                    </div>
                                    <div class="key group relative flex items-center gap-2">
                                        <div class="w-20 bg-black text-white border border-slate-500 px-2 py-0.5">Key</div>
                                        <div class="value">{`${$page.form?.cmyk.summary[index].k.value ?? data?.cmyk.summary[index].k.value}%`}</div>
                                        <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                            {$page.form?.cmyk.summary[index].k.formula ?? data?.cmyk.summary[index].k.formula}
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
                                        <div class="w-20 text-slate-700 bg-white border border-slate-500 px-2 py-0.5">White</div> {$page.form?.cmyk.whiteSpace[index] ?? data?.cmyk.whiteSpace[index]}%
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-20 bg-gradient-to-br from-rose-500 via-violet-500 to-sky-500 text-white border border-slate-500 px-2 py-0.5">Colored</div> {$page.form?.cmyk.coloredSpace[index] ?? data?.cmyk.coloredSpace[index]}%
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
