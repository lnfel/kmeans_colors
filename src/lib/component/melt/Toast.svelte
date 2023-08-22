<script context="module">
    /**
     * @typedef {{
     *      title: String,
     *      description: String,
     *      color: String
     * }} ToastData
     */

    const {
        elements: { content, title, description, close },
        helpers,
        states: { toasts },
        actions: { portal },
    } = createToaster()

    export const addToast = helpers.addToast
</script>

<script>
    import { createToaster, melt } from '@melt-ui/svelte'
    import { flip } from 'svelte/animate'
    import { fly } from 'svelte/transition'
</script>

<div class="fixed bottom-0 right-0 z-50 m-4 flex flex-col items-end gap-2" use:portal>
    {#each $toasts as { id, data } (id)}
        <div
            use:melt={$content(id)}
            animate:flip={{ duration: 500 }}
            in:fly={{ duration: 150, x: '100%' }}
            out:fly={{ duration: 150, x: '100%' }}
            class="rounded-lg bg-neutral-700 text-white shadow-md">
            <div class="relative flex w-[24rem] max-w-[calc(100vw-2rem)] items-center justify-between gap-4 p-5">
                <div>
                    <h3 use:melt={$title(id)} class="flex items-center gap-2 font-semibold">
                        {data.title}
                        <span class="rounded-full square-1.5 {data.color}" />
                    </h3>
                    <div use:melt={$description(id)}>
                        {data.description}
                    </div>
                </div>

                <button use:melt={$close(id)} class="absolute right-4 top-4 grid place-items-center rounded-full text-magnum-500 square-6
                hover:bg-magnum-900/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>
        </div>
    {/each}
</div>