<script>
    import { page } from "$app/stores"
    import { enhance } from "$app/forms"
    import { fly, fade } from 'svelte/transition'
	import { quintOut } from 'svelte/easing'
    import { invalidate } from "$app/navigation"
    import { validateFileInput, error } from "$lib/aerial/client/index.js"

    import Header from "$lib/component/Header.svelte"
    import Pulse from "$lib/component/Pulse.svelte"
    import FileInput from "$lib/component/input/File.svelte"
    import TextInput from "$lib/component/input/Text.svelte"
    // import Filepond from "$lib/component/input/Filepond.svelte"
    import Button from "$lib/component/Button.svelte"

    let fileinput, submitBtn

    async function queue({ form, data, action, cancel }) {
        await invalidate('queue:artifactCollections')
        // let files = data.getAll('file')
        // console.log(files)

        return async ({ result, update }) => {
            console.log(result)
            await update()
        }
    }

    async function reset() {
        await invalidate('queue:artifactCollections')
        error.set(null)
    }

    async function deleteArtifactCollection(event) {
        const id = event.target.dataset.id
        await fetch(`/artifact-collections/${id}`, {
            method: 'DELETE',
            headers: {
                "Accept": "application/json",
            }
        })
        await invalidate('queue:artifactCollections')
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

        <!-- Slide transition is inconsistent, see https://svelte.dev/repl/a2d06d6be2b64abeafcc0d8cde270913?version=3.58.0 -->
        {#each $page.form?.images ?? [] as image, i (image.name)}
            <img 
                in:fly|global="{{ delay: 250 * i, x: -20, duration: 250, easing: quintOut }}"
                out:fade|global={{ delay: 250 * i, easing: quintOut }}
                src={image.base64} alt={image.name} height="240" class="img-preview">
        {/each}

        <div class="overflow-x-auto rounded-md border border-indigo-100 whitespace-nowrap">
            <table class="w-full table-auto text-left">
                <thead class="text-indigo-500 uppercase tracking-wide font-sculpin bg-indigo-100">
                    <tr>
                        <th scope="col" class="px-4 py-1">ID</th>
                        <th scope="col" class="px-4 py-1">Label</th>
                        <th scope="col" class="px-4 py-1">Created at</th>
                        <th scope="col" class="text-right px-4 py-1">Action</th>
                    </tr>
                </thead>

                <tbody>
                    {#each $page?.data?.artifactCollections ?? [] as collection, i}
                        <tr>
                            <th scope="row" class="px-4 py-2">
                                <a href="/artifact-collections/{collection.id}" class="text-indigo-500 outline-none hover:underline focus:underline">{collection.id}</a>
                            </th>
                            <td class="px-4 py-2">{collection.label}</td>
                            <td class="text-sm text-slate-400 dark:text-slate-300 px-4 py-2">
                                {collection.createdAt.toLocaleString('en-PH', {timezone: 'Asia/Manila', hour12: true, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})
                                    .toUpperCase()
                                    .replaceAll(/(,)|([.])/g, '')
                                    .replaceAll(/\s+/g, ' ')
                                    .replaceAll(/\//g, '-')}
                            </td>
                            <td>
                                <div class="flex items-center justify-end gap-2 px-4 py-2">
                                    <button data-id={collection.id} on:click={deleteArtifactCollection} type="button" class="text-rose-400 border border-rose-400 outline-none hover:border-rose-500 focus:text-rose-500 focus:border-rose-500 rounded px-1 py-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 pointer-events-none">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {:else}
                        <tr>
                            <td colspan="4" class="text-center px-4 py-2">No artifact collection yet.</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <!-- <Filepond allowMultiple={true} /> -->
    </section>
</main>
