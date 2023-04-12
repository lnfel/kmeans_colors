<script>
    export let type = 'button'
    export let id
    export let disabled = false
    export let ref = null
</script>

<button on:click {type} {id} bind:this={ref} {disabled} class="inline-flex items-center text-base font-medium rounded-md shadow-sm text-white dark:text-indigo-900 dark:focus:text-white bg-indigo-800 dark:bg-indigo-300 dark:focus:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-200 focus:outline-none focus:ring-2 dark:focus:ring-0 focus:ring-offset-2 dark:focus:ring-offset-0 focus:ring-indigo-800 border-2 border-transparent dark:focus:border-indigo-100 px-4 py-2 disabled:bg-slate-300 dark:disabled:bg-slate-300 dark:disabled:text-slate-400">
    <slot />
</button>
