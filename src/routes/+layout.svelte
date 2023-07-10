<script>
    import { fly } from 'svelte/transition'
    import '../tailwind.css'
    import { pageTransitionsEnabled } from "$lib/aerial/stores/index.js"

    export let data

    /**
     * Toggleable page transition
     * 
     * @param {Element} node
     * @param {import('svelte/transition').FlyParams} options
     * @returns {import('svelte/transition').TransitionConfig} TransitionConfig
     */
    function maybeFly(node, options) {
        if ($pageTransitionsEnabled) {
            return options.fn(node, options)
        }
    }
</script>

{#key data.url}
    <!-- <div in:fly={{ y: -200, duration: 300, delay: 300 }} out:fly={{ y: 200, duration: 300 }}> -->
    <div in:maybeFly={{ fn: fly, y: -100, duration: 250, delay: 250 }} out:maybeFly={{ fn: fly, y: 100, duration: 250 }}>
        <slot />
    </div>
{/key}
