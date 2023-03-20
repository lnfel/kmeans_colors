<script>

    // NOTE: svelte-filepond and filepond is not working on svelte

    // import FilePond, { registerPlugin, supported } from 'svelte-filepond'
    import * as FilePond from 'filepond'
    import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation'
    import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
    import { onMount, onDestroy } from 'svelte'

    // Register the plugins
    // registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview)

    // a reference to the component, used to call FilePond methods
    // let pond
    // pond.getFiles() will return the active files

    // the name to use for the internal file input
    let name = 'filepond'

    function handleInit() {
        console.log('FilePond has initialised')
    }

    function handleAddFile(err, fileItem) {
        console.log('A file has been added', fileItem)
    }

    let fileinput
    let pond
    
    onMount(async () => {
        // const inputElement = document.querySelector('input[type="file"]')
        FilePond.registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview)
        pond = FilePond
        .create(fileinput)
    })

    onDestroy(async () => {
        pond?.destroy(fileinput)
    })
    

    // pond.registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview)
</script>

<!-- <Filepond bind:this={pond} {name} server="/" oninit={handleInit} onaddfile={handleAddFile} /> -->
<input bind:this={fileinput} type="file">

<style global>
/* @import 'filepond/dist/filepond.css';
@import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css'; */
@import 'filepond/dist/filepond.min.css';
</style>