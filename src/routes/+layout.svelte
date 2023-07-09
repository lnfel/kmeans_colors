<script>
    import { fly } from 'svelte/transition'
    import '../tailwind.css'

    export let data
</script>

{#key data.url}
    <div in:fly={{ y: -200, duration: 300, delay: 300 }} out:fly={{ y: 200, duration: 300 }}>
        <slot />
    </div>
{/key}
