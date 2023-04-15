<script>
    import { invalidateAll } from '$app/navigation'
    // import { getClientId, loadGIS } from 'svelte-google-auth/client'
    import { signIn, signOut, initialize, getGapiClient } from 'svelte-google-auth/client'
    import { onMount } from "svelte"
    import { slide } from 'svelte/transition'
    import { quintOut } from 'svelte/easing'

    let tokenClient
    let GClient
    export let data
    const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
    // 'https://www.googleapis.com/auth/drive.metadata.readonly'
    // 'https://www.googleapis.com/auth/drive.file'
    // 'https://www.googleapis.com/auth/drive'
    const SCOPES = ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/drive.file']
    // console.log('data: ', data)
    initialize(data, invalidateAll)

    /**
     * https://github.com/google/google-api-javascript-client/blob/master/docs/reference.md
     */
    onMount(async () => {
        GClient = await getGapiClient()
        // await GClient.init({
        //     apiKey: PUBLIC_GOOGLE_API_KEY,
        //     discoveryDocs: [DISCOVERY_DOC],
        //     // clientId: await getClientId(),
        //     // scope: SCOPES.join(' ')
        // })
        // console.log('GClient: ', GClient)
        // console.log('GClient token: ', GClient.getToken())

        // await loadGIS()

        // if (data.auth.user) {
        //     listFiles()
        // }
        document.addEventListener('click', closeAvatarDropdown)
    })

    /**
     * We are now using server side api call
     * Please see src/routes/+page.server.js
     */
    // async function listFiles() {
    //     await loadGIS()
    //     if (data.auth.user) {
    //         tokenClient = google.accounts.oauth2.initTokenClient({
    //             client_id: data.auth?.client_id,
    //             scope: SCOPES.join(' '),
    //             callback: '', // defined later
    //         })
    //         console.log('tokenClient: ', tokenClient)

    //         let response
    //         try {
    //             response = await GClient.drive.files.list({
    //                 'pageSize': 10,
    //                 'fields': 'files(id, name)',
    //             })
    //         } catch (error) {
    //             console.log(error)
    //         }
    //         const files = response.result.files;
    //         if (!files || files.length == 0) {
    //             document.getElementById('content').innerText = 'No files found.'
    //             return
    //         }
    //         // Flatten to string to display
    //         const output = files.reduce(
    //             // (str, file) => `${str}${file.name} (${file.id})\n`,
    //             (str, file) => `${str}${file.name}\n`,
    //             'Files:\n')
    //         document.getElementById('content').innerText = output
    //     }
    // }

    async function authorize() {
        await signIn(SCOPES)
    }

    async function logout() {
        open = false
        signOut()
        document.getElementById('content').innerText = ''
    }

    let open = false
    function toggleAvatarDropdown() {
        // const dropdownMenu = document.querySelector('[aria-labelledby="menu-button"]')
        // console.log(dropdownMenu)
        open = !open
    }

    function closeAvatarDropdown() {
        open = false
    }

    function menuKeyboardListener(event) {
        if (event.code === 'Escape') {
            closeAvatarDropdown()
        }
    }
</script>

<svelte:head>
    <!-- <script async defer src="https://apis.google.com/js/api.js"></script> -->
    <!-- <script async defer src="https://accounts.google.com/gsi/client"></script> -->

    <!-- https://github.com/chakra-ui/chakra-ui/issues/5909#issue-1210827641 -->
    <meta name="referrer" content="no-referrer" />
</svelte:head>

<div>
    <!-- <button id="authorize_button" on:click={handleAuthClick}>Authorize</button>
    <button id="signout_button" on:click={handleSignoutClick}>Sign Out</button> -->
    <div class="flex justify-end">
        {#if data.auth.user}
            <div class="relative inline-block text-left">
                <div>
                    <button type="button" on:click|stopPropagation={toggleAvatarDropdown} on:keydown={menuKeyboardListener} class="w-10 h-10 p-1 rounded-full bg-white text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-100 outline-none hover:bg-indigo-500 focus:bg-indigo-500" id="menu-button" aria-expanded="true" aria-haspopup="true">
                        <img src={data.auth.user?.picture} alt={data.auth.user?.name} referrerpolicy="no-referrer" class="rounded-full">
                    </button>
                </div>

                {#if open}
                    <div on:click|stopPropagation={()=>{}} on:keydown={menuKeyboardListener} transition:slide="{{delay: 250, duration: 300, easing: quintOut, axis: 'y'}}" class="absolute right-0 z-10 mt-2 whitespace-nowrap origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 p-1 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
                        <div class="text-sm text-gray-700 px-4 py-2">{data.auth.user?.name}</div>
                        <button type="button" on:click={logout} class="text-gray-700 block w-full px-4 py-2 text-left text-sm rounded-md border-2 border-transparent outline-none hover:text-indigo-500 focus:text-indigo-500 focus:border-indigo-500" role="menuitem">
                            Sign Out
                        </button>
                    </div>
                {/if}
            </div>
        {:else}
            <button type="button" on:click={authorize} class="flex items-center gap-2 rounded-md border-2 border-indigo-300 px-2 py-1.5 outline-none hover:border-indigo-500 focus:border-indigo-500 focus:text-indigo-500">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-5 h-5"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg>
                <span class="sr-only lg:not-sr-only">Sign in with Google</span>
            </button>
        {/if}
    </div>

    <div id="content" class="">
        {#each data?.driveFiles ?? [] as file}
            <div>
                <!-- <div>ID: {file.id}</div> -->
                <!-- <div>Name: {file.name}</div> -->
                <!-- <div>{file.name}</div> -->
            </div>
        {/each}
        <!-- {JSON.stringify(data.auth.user)} -->
    </div>
</div>
