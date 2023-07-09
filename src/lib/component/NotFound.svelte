<script>
    import { onMount } from "svelte"

    export let status = ''
    export let message = ''

    const icons = [
        'ei', 'layla-blank', 'wanderer-neko', 'yoimiya'
    ]
    /** @type {String|undefined} */
    let iconpath
    let svgIcon

    /**
     * Random image not more than once
     * 
     * We save the iconIndex to localStorage to keep track of the previous icon shown.
     * Then we show a different icon every time the page reloads.
     * 
     * @param {Number} min Starting index of array
     * @param {Number} max Array length
     * @returns {String} Icon path
     */
    function randomIcon(min = 0, max) {
        min = Math.ceil(min)
        max = Math.floor(max)
        let iconIndex = Math.floor(Math.random() * (max - min) + min)
        const previousIcon = Number(localStorage.getItem("aerial:notFound:previousIcon"))

        while (previousIcon === iconIndex) {
            iconIndex = Math.floor(Math.random() * (max - min) + min)
        }

        localStorage.setItem("aerial:notFound:previousIcon", iconIndex)

        const filename = `${icons[iconIndex]}.svg`
        const iconpath = `/icon/not-found/${filename}`
        return iconpath
    }

    onMount(async () => {
        iconpath = randomIcon(0, icons.length)

        const response = await fetch(iconpath)
        svgIcon = await response.text()
    })
</script>

{#if svgIcon}
    <div class="flex flex-col items-center space-y-4">
        <h1 class="font-sculpin text-3xl self-start lg:self-center">Looks like we are lost...</h1>
        {#if status && message}
            <p class="self-start lg:self-center">{status}: {message}</p>
        {/if}
        <!-- <img src={iconpath} alt="We are lost" width="300" height="300" /> -->
        <div class="text-indigo-510 dark:text-indigo-200">
            {@html svgIcon}
        </div>
        <a href="/" class="inline-flex items-center text-base font-medium rounded-md shadow-sm text-white dark:text-indigo-900 dark:focus:text-white bg-indigo-800 dark:bg-indigo-300 dark:focus:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-200 focus:outline-none focus:ring-2 dark:focus:ring-0 focus:ring-offset-2 dark:focus:ring-offset-0 focus:ring-indigo-800 border-2 border-transparent dark:focus:border-indigo-100 px-4 py-2 disabled:bg-slate-300 dark:disabled:bg-slate-300 dark:disabled:text-slate-400">
            Go back home
        </a>
    </div>
{/if}