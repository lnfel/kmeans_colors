<script>
    import { page } from '$app/stores'

    import NotFound from '$lib/component/NotFound.svelte'
</script>

<svelte:head>
    <title>Not Found | Aerial - Extract dominant colors on image and document files</title>
</svelte:head>

<main class="px-4 lg:px-[3rem]">
    <section class="py-4 space-y-8">
        <NotFound status={$page.status} message={$page?.error?.message} />
    </section>
</main>
