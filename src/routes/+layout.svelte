<script>
    import { onMount } from 'svelte'
    import { browser } from '$app/environment'
    import { fly } from 'svelte/transition'
    import '../tailwind.css'
    import { pageTransitionsEnabled } from "$lib/aerial/stores/index.js"
    import Toaster, { addToast } from '$lib/component/melt/Toast.svelte'

    import Header from "$lib/component/Header.svelte"

    export let data

    /**
     * Toggleable page transition
     * 
     * @param {Element} node
     * @param {import('svelte/transition').FlyParams & { fn: Function }} options
     * @returns {import('svelte/transition').TransitionConfig} TransitionConfig
     */
    function maybeFly(node, options) {
        if ($pageTransitionsEnabled) {
            return options.fn(node, options)
        }
    }

    $: {
        if (browser && data?.session?.message) {
            addToast({
                data: {
                    title: 'Google',
                    description: data.session.message,
                    color: 'bg-rose-500'
                },
                closeDelay: 8000,
            })
        }
    }
</script>

<Header />

{#key data.url}
    <!-- <div in:fly={{ y: -200, duration: 300, delay: 300 }} out:fly={{ y: 200, duration: 300 }}> -->
    <div in:maybeFly={{ fn: fly, y: -100, duration: 250, delay: 250 }} out:maybeFly={{ fn: fly, y: 100, duration: 250 }}>
        <slot />
    </div>
{/key}

<Toaster />
