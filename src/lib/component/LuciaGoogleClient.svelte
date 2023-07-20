<script>
    import { page } from "$app/stores"
    import { onMount } from "svelte"
    import { slide } from "svelte/transition"
    import { quintOut } from "svelte/easing"
    import { enhance } from "$app/forms"
    import { invalidate } from "$app/navigation"
    import { signInWithGoogle } from '$lib/aerial/client/oauth/google/index.js'
    import { pageTransitionsEnabled, devLayoutTestEnabled } from "$lib/aerial/stores/index.js"

    onMount(async () => {
        document.addEventListener('click', closeAvatarDropdown)
    })

    let open = false
    $: user = $page.data?.user

    function toggleAvatarDropdown() {
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

    /**
     * @template {Record<string, unknown> | undefined} Success
     * @template {Record<string, unknown> | undefined} Failure
     * @type {import('@sveltejs/kit').SubmitFunction<Success, Failure>}
     */
    async function logout({ cancel }) {
        closeAvatarDropdown()
        if ($devLayoutTestEnabled) {
            cancel()
            return await simulateLogout()
        }
        
        return async ({ result, update }) => {
            const timeout = $pageTransitionsEnabled ? 600 : 0
            setTimeout(async () => {
                await invalidate('layout:data')
                await update()
                console.log(`[Lucia] Logout result:`, result)
            }, timeout)
        }
    }

    async function login() {
        if ($devLayoutTestEnabled) {
            return await simulateLogin()
        }
        
        const scopes = [
            'openid',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email', 
            'https://www.googleapis.com/auth/drive.file'
        ]
        await signInWithGoogle(scopes)
        await invalidate('layout:data')
    }

    async function simulateLogin() {
        user = {
            name: 'Luca Trulyworth',
            picture: 'https://lh3.googleusercontent.com/a/AAcHTtcQTBCm8fn9yEvOM15rHa-h_tLZIKk61pJFdZodNfy6Nw=s96-c'
        }
    }

    async function simulateLogout() {
        const timeout = $pageTransitionsEnabled ? 600 : 0
        setTimeout(async () => {
            user = false
        }, timeout)
    }

    /**
     * Toggleable slide transition
     * 
     * @param {Element} node
     * @param {import('svelte/transition').FlyParams & { fn: Function }} options
     * @returns {import('svelte/transition').TransitionConfig} TransitionConfig
     */
     function maybeSlide(node, options) {
        if ($pageTransitionsEnabled) {
            return options.fn(node, options)
        }
    }
</script>

<svelte:head>
    <!-- https://github.com/chakra-ui/chakra-ui/issues/5909#issue-1210827641 -->
    <meta name="referrer" content="no-referrer" />
</svelte:head>


<div>
    <div class="flex justify-end">
        {#if user}
            <div class="relative inline-block text-left" in:maybeSlide|global={{ fn: slide, delay: 600, duration: 300, easing: quintOut, axis: 'x' }} out:maybeSlide|global={{ fn: slide, duration: 300, easing: quintOut, axis: 'x' }}>
                <div>
                    <!-- Note: Arbitrary width and height values are needed to match the height of other navigation buttons -->
                    <button type="button" on:click|stopPropagation={toggleAvatarDropdown} on:keydown={menuKeyboardListener} class="p-1 rounded-full bg-white text-sm font-semibold text-gray-900 shadow-sm ring-4 ring-inset ring-white outline-none border border-transparent hover:ring-indigo-500 focus:ring-indigo-500" id="menu-button" aria-expanded="true" aria-haspopup="true">
                        <img src={user?.picture} alt={user?.name} referrerpolicy="no-referrer" class="w-[1.565rem] h-[1.565rem] rounded-full">
                    </button>
                </div>
                {#if open}
                    <div on:click|stopPropagation={()=>{}} on:keydown={menuKeyboardListener} transition:maybeSlide|global={{ fn: slide, duration: 300, easing: quintOut, axis: 'y' }} class="absolute right-0 z-10 mt-2 whitespace-nowrap origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 px-4 py-3 focus:outline-none space-y-2" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
                        <div class="text-lg font-bold font-sculpin tracking-wide text-indigo-600">{user?.name}</div>

                        <form action="/api/oauth/google/logout" method="post" use:enhance={logout}>
                            <button type="submit" title="Sign Out" role="menuitem" class="text-gray-700 block w-full px-2 py-1 text-left text-sm rounded-md border-2 border-slate-300 outline-none hover:text-indigo-500 hover:border-indigo-300 focus:text-indigo-500 focus:border-indigo-500">
                                Sign Out
                            </button>
                        </form>
                    </div>
                {/if}
            </div>
        {:else}
            <!-- <a href="/api/oauth/google/login" in:maybeSlide|global={{ fn: slide, delay: 600, duration: 300, easing: quintOut, axis: 'x' }} out:maybeSlide|global={{ fn: slide, duration: 300, easing: quintOut, axis: 'x' }} class="flex items-center gap-2 overflow-hidden rounded-md border-2 border-indigo-300 px-2 py-1.5 outline-none hover:border-indigo-500 focus:border-indigo-500 focus:text-indigo-500">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-5 h-5"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg>
                <span class="sr-only lg:not-sr-only leading-none !whitespace-nowrap">Sign in with Google</span>
            </a> -->
            <button type="button" on:click={login} in:maybeSlide|global={{ fn: slide, delay: 600, duration: 300, easing: quintOut, axis: 'x' }} out:maybeSlide|global={{ fn: slide, duration: 300, easing: quintOut, axis: 'x' }} class="flex items-center gap-2 overflow-hidden rounded-md border-2 border-indigo-300 px-2 py-1.5 outline-none hover:border-indigo-500 focus:border-indigo-500 focus:text-indigo-500">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-5 h-5"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg>
                <span class="sr-only lg:not-sr-only leading-none !whitespace-nowrap">Sign in with Google</span>
            </button>
        {/if}
    </div>
</div>
