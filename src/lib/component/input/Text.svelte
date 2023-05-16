<script>
    export let value = ""
    export let id
    export let label
    export let name
    export let required = false
    export let error = false
    export let description = ""
    export let placeholder = ""
    export let readonly = false

    export let inputRef = null
</script>

<!--
    Note: do not add padding top and botton as there is a universal bug in macos
    that does not respect focus on elements when user clicks on input padding
-->

<div class="{$$props.class ?? ''} space-y-2">
    <label for="{id}" class="block font-medium text-gray-700 dark:text-white space-y-2">
        <span>{label} {#if error} <span class="text-indigo-200">*</span> {/if}</span>
        {#if description}
        <p class="text-sm">{description}</p>
        {/if}
    </label>
    <div class="group relative">
        <div class="absolute top-0 bottom-0 flex items-center text-indigo-500 p-2 pointer-events-none">
            <slot name="icon" />
        </div>
        <input type="text" {name} {id} {required} {readonly} {placeholder} {...$$restProps} bind:value bind:this={inputRef}
            class:pl-8={$$slots.icon}
            class="block w-full bg-indigo-100 text-indigo-900 text-sm rounded-md shadow-sm outline-none ring-2 ring-indigo-200 dark:ring-indigo-100 focus:ring-indigo-500 focus:dark:ring-indigo-100 border-2 border-transparent focus:dark:border-indigo-500 px-4 leading-[38px] {error ? 'dark:text-indigo-800 border-2 dark:border-red-400 dark:bg-indigo-200 focus:dark:border-red-600 ring-red-600' : 'border-indigo-100'}">
    </div>
    <!--
        Neat trick to set min-width of input to the length of placeholder 
        https://stackoverflow.com/a/60952231/12478479
    -->
    <div class:!pl-8={$$slots.icon} class="h-0 invisible text-sm !mt-0 pl-4 pr-6" aria-hidden="true">{placeholder}</div>
</div>