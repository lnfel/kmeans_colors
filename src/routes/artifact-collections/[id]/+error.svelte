<script>
    import { page } from '$app/stores'

    import Header from "$lib/component/Header.svelte"
</script>

<svelte:head>
    <title>Not Found | Aerial - Extract dominant colors on image and document files</title>
</svelte:head>

<Header />

<main class="lg:px-[3rem]">
    <section class="py-4 space-y-8">
        <div class="space-y-2">
            <h1 class="font-sculpin text-3xl">{$page.status}: {$page.error.message}</h1>
        </div>
    </section>
</main>
