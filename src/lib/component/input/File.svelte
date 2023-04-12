<script>
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
</script>

<div class="{$$props.class} space-y-2">
    <label for="{id}" class="block font-medium text-gray-700 dark:text-white space-y-2">
        <span>{label}</span>
        {#if description}
        <p class="text-sm">{description}</p>
        {/if}
    </label>
    <input type="file" {name} {id} {required} {multiple} {accept} on:change bind:value bind:this={ref}
        aria-label="Media file upload"
        class="block w-full cursor-pointer dark:text-slate-800 bg-indigo-100 text-sm rounded-md shadow-sm outline-none ring-2 ring-indigo-200 dark:ring-indigo-100 focus:ring-indigo-500 focus:dark:ring-indigo-100 border-2 border-transparent focus:dark:border-indigo-500 leading-8 overflow-hidden {error ? 'dark:text-indigo-800 border-2 dark:border-red-400 dark:bg-indigo-200 focus:dark:border-red-600 ring-red-600' : 'border-indigo-100'}">
</div>

<style>
    input[type="file"]::file-selector-button {
        font-weight: 500;
        color: rgb(224 231 255);
        background: rgb(55 48 163);
        border: 2px solid rgb(224 231 255);
        border-radius: 0.375rem;
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