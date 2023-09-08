<script>
    import { slide } from "svelte/transition"
    import { quintOut } from "svelte/easing"
    import { browser, dev } from "$app/environment"
    import { pageTransitionsEnabled, devLayoutTestEnabled, aerialTheme, menuExpanded } from "$lib/aerial/stores/index.js"

    import Logo from "$lib/component/Logo.svelte"
    import LuciaGoogleClient from "$lib/component/LuciaGoogleClient.svelte"

    let preferencesToggle = false
    $: systemTheme = $aerialTheme === null ? true : false

    if (browser) {
        document.addEventListener('click', closePreferencesDropdown)
        let theme = localStorage.getItem("aerial:theme")
        theme !== null
            ? aerialTheme.set(theme === 'dark' ? true : false)
            : aerialTheme.set(null)
        pageTransitionsEnabled.set(localStorage.getItem("aerial:preferences:pageTransitionsEnabled"))
        devLayoutTestEnabled.set(localStorage.getItem("aerial:preferences:devLayoutTestEnabled"))
    }

    function togglePreferencesDropdown() {
        preferencesToggle = !preferencesToggle
    }

    function closePreferencesDropdown() {
        preferencesToggle = false
    }

    /**
     * @param {KeyboardEvent} event
     */
    function menuKeyboardListener(event) {
        if (event.code === 'Escape') {
            closePreferencesDropdown()
        }
    }

    /**
     * @param {Event & { target: HTMLInputElement }} event
     * @param {import('svelte/store').Writable<?Boolean>} store
     */
    function togglePreference({ target }, store) {
        target.checked
            ? localStorage.setItem(`aerial:preferences:${target.value}`, true)
            : localStorage.removeItem(`aerial:preferences:${target.value}`)
        store.update(() => localStorage.getItem(`aerial:preferences:${target.value}`))
        if (target.value === 'pageTransitionsEnabled') {
            closePreferencesDropdown()
        }
    }

    /**
     * Toggle between light and dark theme or system preference
     * 
     * 
     * ```js
     * dark = true
     * light = false
     * system = null
     * ```
     * 
     * @param {Event & { target: HTMLInputElement }} event
     * @param {import('svelte/store').Writable<'light' | 'dark'>} store
     */
    function toggleTheme({ target }, store) {
        const switchToNextThemeMap = {
            dark: {
                next: () => localStorage.setItem('aerial:theme', 'light'),
                value: 'light'
            },
            light: {
                next: () => localStorage.removeItem('aerial:theme'),
                value: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
            },
            system: {
                next: () => localStorage.setItem('aerial:theme', 'dark'),
                value: 'dark'
            },
        }
        let theme = localStorage.getItem("aerial:theme") === null ? 'system' : localStorage.getItem("aerial:theme")
        switchToNextThemeMap[theme].next()
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(switchToNextThemeMap[theme].value)
        theme = localStorage.getItem("aerial:theme")
        theme !== null
            ? aerialTheme.set(theme === 'dark' ? true : false)
            : aerialTheme.set(null)
    }

    function systemThemeButtonBG() {
        if (!systemTheme) return '';

        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'peer-indeterminate:after:bg-slate-800'
            : 'peer-indeterminate:after:bg-white'
    }

    function aerialThemeLabel(checked) {
        if (typeof checked === 'boolean') {
            return checked ? 'dark' : 'light'
        }
        return null
    }

    /**
     * Toggleable transition
     * 
     * NOTE: TransitionConfig is only returned upon appending the element on the DOM.
     * The out transition will use the same TransitionConfig set upon during creation/appending of element to DOM.
     * New TransitionConfig will be returned on the next cycle of in transition (during creation/appending of element to DOM).
     * Even if we make this reactive, the change will not take effect until the second in transition.
     * The solution it to close the dropdown after changing preference.
     * 
     * @param {Element} node
     * @param {import('svelte/transition').SlideParams & { fn: Function }} options
     * @returns {import('svelte/transition').TransitionConfig} TransitionConfig
     */
    $: maybeTransition = (node, options) => {
        options = {
            fn: options.fn,
            delay: $pageTransitionsEnabled ? options.delay : 0,
            duration: $pageTransitionsEnabled ? options.duration : 0,
            easing: options.easing,
            axis: options.axis
        }
        return options.fn(node, options)
    }

    /**
     * Convert string true and false to boolean counterparts
     * 
     * @param {String} string
     * @returns {Boolean} boolean
     */
    function stringToBoolean(string) {
        if (/^true$/i.test(string)) {
            return true
        }
        if (/^false$/i.test(string)) {
            return false
        }
    }

    /**
     * @param {MouseEvent & { target: HTMLButtonElement }}
     */
    function toggleMenu({ target }) {
        menuExpanded.set(!stringToBoolean(target.ariaExpanded))
        // console.log(menuExpanded, typeof menuExpanded)
        target.ariaExpanded = $menuExpanded
    }

    function closeMenu() {
        const navigationToggle = document.querySelector('#navigationToggle')
        $menuExpanded.set(false)
        navigationToggle.ariaExpanded = $menuExpanded
    }
</script>

<header class="sticky top-0 pb-2 md:pb-0 px-4 lg:px-[3rem] space-y-4 md:space-y-0 z-10">
    <div class="container mx-auto flex flex-col md:flex-row md:items-center justify-between">
    <Logo />

    <!-- <button id="navigationToggle" title="Navigation toggle" on:click|stopPropagation={toggleMenu} type="button" class="md:hidden text-slate-700 dark:text-indigo-200 rounded-md border-2 border-indigo-300 px-1.5 py-1 outline-none hover:border-indigo-500 focus:border-indigo-500 focus:text-indigo-500" aria-controls="navigationMenu" aria-expanded="false" aria-label="Navigation toggle">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu pointer-events-none w-6 h-6">
            <line x1="4" x2="20" y1="12" y2="12"/>
            <line x1="4" x2="20" y1="6" y2="6"/>
            <line x1="4" x2="20" y1="18" y2="18"/>
        </svg>
        <span class="sr-only">Navigation toggle</span>
    </button> -->

    <!-- {#if $menuExpanded || onMediumScreen} -->
        <!-- absolute md:static top-full  -->
        <div id="navigationMenu" class="w-full inline-grid place-content-stretch md:place-content-end gap-2" style="grid-template-columns: auto auto auto auto auto;">
            <a href="/" title="Home" in:maybeTransition={{ fn: slide, duration: 250, easing: quintOut, axis: 'y' }} out:maybeTransition={{ fn: slide, delay: 250, duration: 250, easing: quintOut, axis: 'y' }} class="menu-item md:max-w-fit flex justify-center text-slate-700 dark:text-indigo-200 rounded-md border-2 border-indigo-300 px-1.5 py-1 outline-none hover:border-indigo-500 focus:border-indigo-500 focus:text-indigo-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home w-6 h-6">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span class="sr-only">Home</span>
            </a>
            <a href="/queue" title="Queue" in:maybeTransition={{ fn: slide, delay: 100, duration: 250, easing: quintOut, axis: 'y' }} out:maybeTransition={{ fn: slide, delay: 200, duration: 250, easing: quintOut, axis: 'y' }} class="menu-item md:max-w-fit flex justify-center text-slate-700 dark:text-indigo-200 rounded-md border-2 border-indigo-300 px-1.5 py-1 outline-none hover:border-indigo-500 focus:border-indigo-500 focus:text-indigo-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers w-6 h-6">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                    <polyline points="2 17 12 22 22 17"/>
                    <polyline points="2 12 12 17 22 12"/>
                </svg>
                <span class="sr-only">Queue</span>
            </a>
            <a href="/docs" title="Docs" in:maybeTransition={{ fn: slide, delay: 150, duration: 250, easing: quintOut, axis: 'y' }} out:maybeTransition={{ fn: slide, delay: 150, duration: 250, easing: quintOut, axis: 'y' }} class="menu-item md:max-w-fit flex justify-center text-slate-700 dark:text-indigo-200 rounded-md border-2 border-indigo-300 px-1.5 py-1 outline-none hover:border-indigo-500 focus:border-indigo-500 focus:text-indigo-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text w-6 h-6">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/>
                    <line x1="16" x2="8" y1="17" y2="17"/>
                    <line x1="10" x2="8" y1="9" y2="9"/>
                </svg>
                <span class="sr-only">Docs</span>
            </a>

            <!-- Preferences -->
            <div class="menu-item dropdown-menu relative" in:maybeTransition={{ fn: slide, delay: 200, duration: 250, easing: quintOut, axis: 'y' }} out:maybeTransition={{ fn: slide, delay: 100, duration: 250, easing: quintOut, axis: 'y' }}>
                <button title="Preferences" on:click|stopPropagation={togglePreferencesDropdown} on:keydown={menuKeyboardListener} type="button" class="dropdown-toggle w-full md:max-w-fit flex justify-center text-slate-700 dark:text-indigo-200 rounded-md border-2 border-indigo-300 px-1.5 py-1 outline-none hover:border-indigo-500 focus:border-indigo-500 focus:text-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-2 w-6 h-6">
                        <path d="M20 7h-9"/><path d="M14 17H5"/>
                        <circle cx="17" cy="17" r="3"/>
                        <circle cx="7" cy="7" r="3"/>
                    </svg>
                    <span class="sr-only">Preferences</span>
                </button>

                {#if preferencesToggle}
                    <div on:click|stopPropagation={()=>{}} on:keydown={menuKeyboardListener} transition:maybeTransition|local={{ fn: slide, duration: 300, easing: quintOut }} class="dropdown-list absolute right-0 z-10 whitespace-nowrap origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 px-4 py-3 mt-2 focus:outline-none space-y-2" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
                        <span class="text-lg font-bold font-sculpin tracking-wide text-indigo-600">Preferences</span>

                        <label class="relative flex items-center cursor-pointer">
                            <input id="aerialTheme" type="checkbox" bind:indeterminate={systemTheme} bind:checked={$aerialTheme} on:change={(event) => toggleTheme(event, aerialTheme)} value="aerialTheme" class="sr-only peer">
                            <div class="w-11 h-6 bg-indigo-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-400 dark:peer-focus:ring-indigo-300 rounded-full peer dark:bg-gray-400 peer-checked:after:translate-x-full peer-indeterminate:after:translate-x-1/2 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white {systemThemeButtonBG()} after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                            <span class="ml-3 text-sm capitalize font-medium text-gray-900 dark:text-gray-800">{ aerialThemeLabel($aerialTheme) ?? 'System' }</span>
                        </label>

                        <label class="relative flex items-center cursor-pointer">
                            <input id="transitionPreference" type="checkbox" bind:checked={$pageTransitionsEnabled} on:change={(event) => togglePreference(event, pageTransitionsEnabled)} value="pageTransitionsEnabled" class="sr-only peer">
                            <div class="w-11 h-6 bg-indigo-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-400 dark:peer-focus:ring-indigo-300 rounded-full peer dark:bg-gray-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                            <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-800">Page transitions</span>
                        </label>

                        {#if dev}
                            <label class="relative flex items-center cursor-pointer">
                                <input id="devLayoutTestPreference" type="checkbox" bind:checked={$devLayoutTestEnabled} on:change={(event) => togglePreference(event, devLayoutTestEnabled)} value="devLayoutTestEnabled" class="sr-only peer">
                                <div class="w-11 h-6 bg-indigo-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-400 dark:peer-focus:ring-indigo-300 rounded-full peer dark:bg-gray-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-800">Layout test</span>
                            </label>
                        {/if}
                    </div>
                {/if}
            </div>

            <LuciaGoogleClient />
        </div>
    <!-- {/if} -->
    </div>
</header>

<style>
    :global(.light header),
    :global(header) {
        /* bg-indigo-50 */
        background-image: radial-gradient(transparent 1px, #eef2ff 1px);
        background-size: 4px 4px;
        backdrop-filter: saturate(50%) blur(4px);
    }

    :global(.dark header) {
        /* bg-slate-800 */
        background-image: radial-gradient(transparent 1px, #1e293b 1px);
        background-size: 4px 4px;
        backdrop-filter: saturate(50%) blur(4px);
    }

    @media (prefers-color-scheme: dark) {
        :global(header) {
            /* bg-slate-800 */
            background-image: radial-gradient(transparent 1px, #1e293b 1px);
            background-size: 4px 4px;
            backdrop-filter: saturate(50%) blur(4px);
        }
    }

    @media (min-width: 768px) {
        :global(#navigationMenu) {
            background: none;
            backdrop-filter: none;
        }
    }
</style>
