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
        GClient = await getGapiClient({
            discoveryDocs: [DISCOVERY_DOC]
        })
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

    async function clearAerialFolder() {
        if (data.aerialFolder?.id) {
            await GClient.drive.files.delete({
                fileId: data.aerialFolder?.id
            })
            await invalidateAll()
            // console.log(data)
        }
    }
    // console.log(data)
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
                    <!-- Note: Arbitrary width and height values are needed to match the height of other navigation buttons -->
                    <button type="button" on:click|stopPropagation={toggleAvatarDropdown} on:keydown={menuKeyboardListener} class="p-1 rounded-full bg-white text-sm font-semibold text-gray-900 shadow-sm ring-4 ring-inset ring-white outline-none border border-transparent hover:ring-indigo-500 focus:ring-indigo-500" id="menu-button" aria-expanded="true" aria-haspopup="true">
                        <img src={data.auth.user?.picture} alt={data.auth.user?.name} referrerpolicy="no-referrer" class="w-[1.565rem] h-[1.565rem] rounded-full">
                    </button>
                </div>

                {#if open}
                    <div on:click|stopPropagation={()=>{}} on:keydown={menuKeyboardListener} transition:slide|global="{{delay: 250, duration: 300, easing: quintOut, axis: 'y'}}" class="absolute right-0 z-10 mt-2 whitespace-nowrap origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 px-4 py-3 focus:outline-none space-y-2" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
                        <div class="text-lg font-bold font-sculpin tracking-wide text-indigo-600">{data.auth.user?.name}</div>

                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-xs text-slate-800">Storage ({data?.storageQuota?.occupiedSpace}% full)</span>
                            </div>
                            <div class="min-w-[160px] w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-400">
                                <div class="bg-indigo-600 h-2.5 rounded-full" style={`width: ${data?.storageQuota?.occupiedSpace}%`}></div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 text-xs text-slate-800">
                            <span>Aerial folder size: {data?.aerialFolder?.totalSize ?? '0 bytes'}</span>
                            <button type="button" on:click={clearAerialFolder} disabled="{data?.aerialFolder === null}" title="Clear Aerial folder" role="menuitem" class="text-indigo-600 p-1 text-left text-sm rounded-md border-2 border-transparent outline-none hover:text-indigo-500 focus:text-indigo-500 focus:border-indigo-500 disabled:text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                                <span class="sr-only">Clear Aerial folder</span>
                            </button>
                        </div>

                        <button type="button" on:click={logout} title="Sign Out" role="menuitem" class="text-gray-700 block w-full py-2 text-left text-sm rounded-md border-2 border-transparent outline-none hover:text-indigo-500 focus:text-indigo-500 focus:border-indigo-500">
                            Sign Out
                        </button>
                    </div>
                {/if}
            </div>
        {:else}
            <button type="button" on:click={authorize} class="flex items-center gap-2 rounded-md border-2 border-indigo-300 px-2 py-1.5 outline-none hover:border-indigo-500 focus:border-indigo-500 focus:text-indigo-500">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-5 h-5"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg>
                <span class="sr-only lg:not-sr-only leading-none">Sign in with Google</span>
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
