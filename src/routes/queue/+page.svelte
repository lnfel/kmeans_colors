<script>
    import { onMount } from 'svelte'
    import { page } from "$app/stores"
    import { enhance } from "$app/forms"
    import { fly, fade } from 'svelte/transition'
	import { backOut, quintOut, sineOut } from 'svelte/easing'
    import { invalidateAll } from "$app/navigation"
    // import ShortUniqueId from "short-unique-id"
    import { validateFileInput, error, hasFile } from "$lib/aerial/client/index.js"
    import LamyDebugbar from "lamy-debugbar"

    import Header from "$lib/component/Header.svelte"
    import Pulse from "$lib/component/Pulse.svelte"
    import FileInput from "$lib/component/input/File.svelte"
    import TextInput from "$lib/component/input/Text.svelte"
    // import Filepond from "$lib/component/input/Filepond.svelte"
    import Button from "$lib/component/Button.svelte"

    // const uid = new ShortUniqueId()
    let fileinput, submitBtn

    onMount(async () => {

    })

    async function queue({ form, data, action, cancel }) {
        await invalidateAll()
        // let files = data.getAll('file')
        // console.log(files)

        return async ({ result, update }) => {
            hasFile.set(false)
            console.log(result)
            await update()

            // const response = await fetch('/api/queue', {
            //     method: 'POST',
            //     headers: {
            //         "Content-Type": "application/json",
            //     },
            //     body: JSON.stringify(result.data)
            // })
            // console.log(await response.json())
        }
    }

    async function reset() {
        await invalidateAll()
        error.set(null)
    }
</script>

<svelte:head>
    <title>Queue | Aerial - Extract dominant colors on image and document files</title>
    <link rel="alternate" hreflang="en" href="https://www-staging.pingsailor.com/queue" />
    <link rel="canonical" href="https://www-staging.pingsailor.com/queue"/>
</svelte:head>

<Header />

<main class="lg:px-[3rem]">
    <section class="py-4 space-y-8">
        <div class="space-y-2">
            <h1 class="font-sculpin text-3xl">Aerial Queue</h1>
            <p>Extract colors of images and document files in queued batches.</p>
        </div>

        <form method="POST" use:enhance={queue} class="flex flex-wrap gap-4" enctype="multipart/form-data">
            <TextInput label="Label" id="label" name="label" placeholder="Optional label for this collection">
                <svg slot="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
            </TextInput>

            <FileInput bind:ref={fileinput} on:change={validateFileInput}
                label="Upload"
                description={`Supported file types are png, jpeg, webp, gif, svg, tiff, docx and pdf. Uploads 5 files max.`}
                id="file" name="file" multiple accept="image/*,.pdf,.docx,.doc" />

            <div class="flex items-end gap-2">
                <!-- <Button bind:ref={submitBtn} type="submit" id="submit" disabled="{!$hasFile}">
                    Submit
                </Button> -->
                <Button bind:ref={submitBtn} type="submit" id="submit">
                    Submit
                </Button>
                <Button on:click={reset} type="reset" id="reset">
                    Reset
                </Button>
            </div>
        </form>
        {#if $error}
            <div class="text-rose-500 dark:text-rose-300">{$error?.message}</div>
        {/if}

        {#each $page.form?.images ?? [] as image, i (image.name)}
            <img 
                in:fly="{{ delay: 250 * i, x: -20, duration: 250, easing: quintOut }}"
                out:fade={{ delay: 250 * i, easing: quintOut }}
                src={image.base64} alt={image.name} height="240">
        {/each}

        <!-- Slide transition is inconsisten, see https://svelte.dev/repl/a2d06d6be2b64abeafcc0d8cde270913?version=3.58.0 -->
        <!-- {#each $page.form?.images ?? [] as image, i (image.name)}
            <img id={i}
                in:slide|local="{{ delay: 250 * i, duration: 300, easing: quintOut, axis: 'y' }}"
                out:slide|local="{{ delay: 250 * i, duration: 300, easing: quintOut, axis: 'y' }}"
                src={image.base64} alt={image.name} height="240" class="block">
        {/each} -->

        <div class="grid grid-cols-3 rounded-b-md border-b border-indigo-100">
            <div class:rounded-bl-md={$page?.data?.artifacts.length === 0} class="bg-indigo-100 text-indigo-500 text-lg font-sculpin px-2 py-1 rounded-tl-md">ID</div>
            <div class="bg-indigo-100 text-indigo-500 text-lg font-sculpin px-2 py-1">Label</div>
            <div class:rounded-br-md={$page?.data?.artifacts.length === 0} class="bg-indigo-100 text-indigo-500 text-lg font-sculpin px-2 py-1 rounded-tr-md">Created at</div>

            {#each $page?.data?.artifacts as artifact, i}
                <div class:rounded-bl-md={$page?.data?.artifacts.length === i + 1} class="px-2 py-1 border-l border-indigo-100">
                    {artifact.id}
                </div>
                <div class="px-2 py-1">
                    {artifact.label}
                </div>
                <div class:rounded-br-md={$page?.data?.artifacts.length === i + 1} class="px-2 py-1 border-r border-indigo-100">
                    {artifact.createdAt.toLocaleString('en-PH', {timezone: 'Asia/Manila', hour12: true, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})
                        .toUpperCase()
                        .replaceAll(/(,)|([.])/g, '')
                        .replaceAll(/\s+/g, ' ')
                        .replaceAll(/\//g, '-')}
                </div>
            {/each}
        </div>

        <div class="grid grid-cols-3 rounded-b-md border-b border-indigo-100">
            <div class:rounded-bl-md={$page?.data?.artifactCollections.length === 0} class="bg-indigo-100 text-indigo-500 text-lg font-sculpin px-2 py-1 rounded-tl-md">ID</div>
            <div class="bg-indigo-100 text-indigo-500 text-lg font-sculpin px-2 py-1">Label</div>
            <div class:rounded-br-md={$page?.data?.artifactCollections.length === 0} class="bg-indigo-100 text-indigo-500 text-lg font-sculpin px-2 py-1 rounded-tr-md">Created at</div>

            {#each $page?.data?.artifactCollections as artifact, i}
                <div class:rounded-bl-md={$page?.data?.artifactCollections.length === i + 1} class="px-2 py-1 border-l border-indigo-100">
                    {artifact.id}
                </div>
                <div class="px-2 py-1">
                    {artifact.label}
                </div>
                <div class:rounded-br-md={$page?.data?.artifactCollections.length === i + 1} class="px-2 py-1 border-r border-indigo-100">
                    {artifact.createdAt.toLocaleString('en-PH', {timezone: 'Asia/Manila', hour12: true, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})
                        .toUpperCase()
                        .replaceAll(/(,)|([.])/g, '')
                        .replaceAll(/\s+/g, ' ')
                        .replaceAll(/\//g, '-')}
                </div>
            {/each}
        </div>

        <!-- <div>
            {JSON.stringify($page)}
        </div> -->
        <!-- <div>
            {JSON.stringify(form)}
        </div> -->
        <!-- <Filepond allowMultiple={true} /> -->
        <!-- <pre>
{JSON.stringify($page?.data?.artifactCollections, null, 4)}
        </pre> -->
        <LamyDebugbar data={{"artifactCollections": $page?.data?.artifactCollections}} />
    </section>
</main>
