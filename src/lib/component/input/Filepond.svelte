<script>
    import { onMount } from 'svelte'
    import * as Filepond from 'filepond'

    export let allowMultiple = false
    export let name = 'filepond'
    export let id = 'filepond'

    let filepond
    let fileinput

    /**
     * TODO: Setup server config
     */
    onMount(async () => {
        if (!filepond) {
            filepond = Filepond.create(fileinput)
        }
        filepond.allowMultiple = allowMultiple
        filepond.allowReorder = true
        filepond.maxFiles = 5
        // Ideal labelIdle, no issues with single uploads alignment
        filepond.labelIdle = `
            <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" height="40" viewBox="0 96 960 960" width="40">
                    <path fill="currentColor" d="M253.333 896q-87.666 0-150.5-62.333Q40 771.333 40 683.667q0-78 48.667-138 48.666-60 126-73.667 21.666-95.333 96-155.333 74.333-60 170.666-60 114.334 0 192.5 81.5Q752 419.667 752 534.667v16Q823 552 871.5 601.5T920 723.334q0 70.999-50.833 121.833Q818.333 896 747.334 896H513.333q-27 0-46.833-19.833t-19.833-46.833V587.999l-53.334 53.334Q383.666 651 370 650.667q-13.667-.334-23.333-10Q337 631 337 617q0-14 9.667-23.667l110-110q5.333-5.333 11.089-7.5 5.755-2.166 12.333-2.166t12.244 2.166q5.667 2.167 11 7.5L614 594q9.667 9.667 9.667 23.333 0 13.667-9.667 23.334-9.667 9.666-23.667 9.666-13.999 0-23.666-9.666l-53.334-52.668v241.335h234.001q44 0 75-31t31-75q0-44.001-31-75.001-31-31-75-31h-62.001v-82.666q0-87-59.833-149.167t-146.833-62.167q-87 0-147.167 62.167t-60.167 149.167H252q-60.667 0-103 42.666Q106.666 620 106.666 682q0 60.667 42.953 104 42.952 43.334 103.714 43.334h93.334q14.167 0 23.75 9.617 9.584 9.617 9.584 23.833 0 14.216-9.584 23.716-9.583 9.5-23.75 9.5h-93.334ZM480 609.333Z"/>
                </svg>
                <div>Drag & Drop your files or <span class="filepond--label-action"> Browse </span></div>
            </div>
        `

        filepond.on('init', () => {
            filepond.element.classList.remove('hidden')
        })

        filepond.on('warning', (error, file, status) => {
            console.log(error)
            console.log(file)
            console.log(status)
        })
    })
</script>

<input {id} {name} bind:this={fileinput} type="file" class="hidden">

<style global>
    @import 'filepond/dist/filepond.min.css';

    /**
     * Trying to center filepond item when allowMultiple is false (single uploads)
     */
    /* :global(.filepond--root .filepond--list-scroller) {
        height: 100%;
        margin: 0;
        margin-top: 0.25em;
    }
    :global(.filepond--list.filepond--list) {
        position: static;
        padding: 0.25em 0.75em;
        height: 100%;
        display: flex;
        align-items: center;
    }
    :global(.filepond--item) {
        position: static;
        flex-grow: 1;
    } */

    /* These are required only when setting labelIdle height larger than default */
    /**
     * Setting allowMultiple auto adjusts the height of filepond--root
     * when file(s) is/are uploaded
     */
    /* :global(.filepond--root .filepond--drop-label > label) {
        padding-top: 2rem;
        padding-bottom: 2rem;
    } */
    /**
     * Required so .filepond--root .filepond--drop-label > label padding would take effect
     */
    /* :global(.filepond--root .filepond--drop-label) {
        height: min-content;
    } */

    :global(.filepond--panel-root) {
        background-color: rgb(224 231 255);
        border: 2px solid rgb(165 180 252);
    }
    :global(.filepond--drop-label) {
        color: rgb(55 48 163);
    }
    :global(.filepond--label-action) {
        text-decoration-color: rgb(55 48 163);
    }
    :global(.filepond--item-panel) {
        background-color: rgb(165 180 252);
    }
    :global(.filepond--drip-blob) {
        background-color: rgb(55 48 163);
    }
    :global(.filepond--file-info-main),
    :global(.filepond--file-info-sub) {
        color: rgb(55 48 163);
    }
    :global(.filepond--file-action-button) {
        background-color: rgb(55 48 163);
    }
    :global(.filepond--file-action-button:focus),
    :global(.filepond--file-action-button:hover) {
        cursor: pointer;
        box-shadow: 0 0 0 0.125em rgb(224 231 255);
    }
    :global(.filepond--credits) {
        outline: none;
    }
    :global(.filepond--credits:hover),
    :global(.filepond--credits:focus) {
        text-decoration: underline;
    }

    @media (prefers-color-scheme: dark) {
        :global(.filepond--panel-root) {
            background-color: rgb(224 231 255);
            border: 2px solid rgb(224 231 255);
        }
        :global(.filepond--credits:hover),
        :global(.filepond--credits:focus) {
            text-decoration: underline;
        }
    }
</style>
