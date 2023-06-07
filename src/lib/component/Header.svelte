<script>
    import { page } from "$app/stores"
    
    import Logo from "$lib/component/Logo.svelte"
    import GoogleClient from "$lib/component/GoogleClient.svelte"
</script>

<header class="flex items-center justify-between lg:px-[3rem]">
    <Logo />
    <div class="flex items-center gap-2">
        <a href="/" class="text-slate-700 dark:text-indigo-200 rounded-md border-2 border-indigo-300 px-1.5 py-1 outline-none hover:border-indigo-500 focus:border-indigo-500 focus:text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span class="sr-only">Home</span>
        </a>
        <a href="/queue" class="text-slate-700 dark:text-indigo-200 rounded-md border-2 border-indigo-300 px-1.5 py-1 outline-none hover:border-indigo-500 focus:border-indigo-500 focus:text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
            <span class="sr-only">Queue</span>
        </a>
        <GoogleClient data={$page.data} />
    </div>
</header>
