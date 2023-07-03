<script>
    import { slide } from 'svelte/transition'
    import { flip } from 'svelte/animate'
	import { quintOut, sineOut } from 'svelte/easing'

    export let value = ""
    export let id
    export let label
    export let name
    export let required = false
    export let error = false
    export let description = ""
    export let accept
    export let multiple = false

    export let ref = null

    let showInfo = false
    /**
     * Allow toggling of input info on small screens
     * and disable toggle on medium screens and above
     */
    const toggleInfo = (event) => {
        const mediaQuery = window.matchMedia('(min-width: 768px)')

        mediaQuery.matches
            ? null
            : showInfo = !showInfo
    }
</script>

<div class="{$$props.class ?? ''} file-input space-y-2 transition-all duration-1000 ease-linear">
    <label for="{id}" class="block font-medium text-gray-700 dark:text-white">
        <div class="flex items-center gap-1">
            <span>{label}</span>
            {#if description}
                <button on:click={toggleInfo} type="button" class="group relative hover:text-[#e4b124] dark:hover:text-[#e4b124]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <div class="invisible cursor-default md:group-hover:visible w-[30ch] absolute top-1/2 -translate-y-1/2 left-[150%] bg-slate-800 text-left text-white text-sm dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:right-full after:top-1/2 after:-translate-y-1/2 after:border-8 after:border-solid after:border-transparent after:border-r-slate-800 after:dark:border-r-white">
                        {description}
                    </div>
                </button>
            {/if}
        </div>
        {#if showInfo}
            <div
                in:slide|global="{{delay: 250, duration: 300, easing: quintOut, axis: 'x'}}"
                out:slide|global="{{delay: 500, duration: 300, easing: sineOut, axis: 'x'}}">
                <div class="md:hidden"
                    in:slide|global="{{delay: 500, duration: 300, easing: quintOut, axis: 'y'}}"
                    out:slide|global="{{delay: 250, duration: 300, easing: quintOut, axis: 'y'}}">
                    {#each description.split(/\r?\n/) as description}
                        <p class="text-sm">{description}</p>
                    {/each}
                </div>
            </div>
        {/if}
    </label>
    <input type="file" {name} {id} {required} {multiple} {accept} on:change bind:value bind:this={ref}
        aria-label="Media file upload"
        class="block w-full cursor-pointer dark:text-slate-800 bg-indigo-100 text-sm rounded-md shadow-sm outline-none ring-2 ring-indigo-200 dark:ring-indigo-100 focus:ring-indigo-500 focus:dark:ring-indigo-100 border-2 border-transparent focus:dark:border-indigo-500 leading-8 overflow-hidden transition-all duration-250 ease-linear {error ? 'dark:text-indigo-800 border-2 dark:border-red-400 dark:bg-indigo-200 focus:dark:border-red-600 ring-red-600' : 'border-indigo-100'}">
</div>

<style>
    input[type="file"]::file-selector-button {
        font-weight: 500;
        color: rgb(224 231 255);
        background: rgb(55 48 163);
        border: 2px solid rgb(224 231 255);
        border-radius: 0.375rem;
        cursor: pointer;
    }
    input[type="file"]:hover::file-selector-button {
        background: rgb(99 102 241);
    }
    input[type="file"]:focus::file-selector-button {
        border: 2px solid rgb(224 231 255);
    }
    input[type="file"]:focus-within {
        --tw-ring-offset-width: 2px;
        --tw-ring-opacity: 1;
        --tw-ring-color: rgb(99 102 241 / var(--tw-ring-opacity));
        --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
        --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
        box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
    }

    @media (prefers-color-scheme: dark) {
        input[type="file"]::file-selector-button {
            color: rgb(55 48 163);
            background: rgb(199 210 254);
            border: 2px solid rgb(224 231 255);
            border-radius: 0.275rem;
        }
        input[type="file"].dark\:bg-indigo-200::file-selector-button {
            border: 2px solid rgb(199 210 254);
        }
        input[type="file"]:hover::file-selector-button {
            background: rgb(165 180 252);
        }
        input[type="file"].dark\:bg-indigo-200:hover::file-selector-button {
            background: rgb(224 231 255);
        }
        input[type="file"]:focus::file-selector-button {
            color: rgb(255 255 255);
            background: rgb(99 102 241);
            border-color: rgb(224 231 255);
        }
        input[type="file"]:focus-within {
            border-color: rgb(99 102 241);
            --tw-ring-color: transparent;
            box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
        }
        input[type="file"]:focus-within::file-selector-button {
            color: rgb(255 255 255);
            background: rgb(55 48 163);
        }
        input[type="file"].dark\:bg-indigo-200:focus-within::file-selector-button {
            color: rgb(255 255 255);
            background: rgb(55 48 163);
        }
    }
</style>