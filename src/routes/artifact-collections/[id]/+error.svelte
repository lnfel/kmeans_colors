<script>
    import { page } from '$app/stores'

    import Header from "$lib/component/Header.svelte"
    import NotFound from '$lib/component/NotFound.svelte'
</script>

<svelte:head>
    <title>Not Found | Aerial - Extract dominant colors on image and document files</title>
</svelte:head>

<Header />

<main class="lg:px-[3rem]">
    <section class="py-4 space-y-8">
        <NotFound status={$page.status} message={$page?.error?.message} />
    </section>
</main>
