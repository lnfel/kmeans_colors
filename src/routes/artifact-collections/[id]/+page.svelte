<script>
    import { page } from "$app/stores"

    /**
     * Paginate algorithm to generate pagination UI
     * 
     * https://gist.github.com/kottenator/9d936eb3e4e3c3e02598?permalink_comment_id=4218361#gistcomment-4218361
     * 
     * Huge thanks to zacfukuda
     * https://gist.github.com/zacfukuda
     * 
     * @param {{
     * current: Number, //current The current page
     * max: Number, //max Total number of pages
     * }}
     * @returns {{ current: Number, prev: Number, next: Number, items: Array }} Pagination data
     */
    function paginate({ current, max }) {
        if (!current || !max) return null

        let prev = current === 1 ? null : current - 1,
            next = current === max ? null : current + 1,
            items = [1]
        
        if (current === 1 && max === 1) return {current, prev, next, items}
        if (current > 4) items.push('…')

        let r = 2, r1 = current - r, r2 = current + r

        for (let i = r1 > 2 ? r1 : 2; i <= Math.min(max, r2); i++) items.push(i)

        if (r2 + 1 < max) items.push('…')
        if (r2 < max) items.push(max)

        return {current, prev, next, items}
    }

    // Paginate test
    // for (let max = 1; max < 10; max+=2) {
    //     console.log(`max: ${max}`)
    //     for (let current = 1; current <= max; current++) {
    //         let pagination = paginate({current, max})
    //         console.log(`  c:${current}`, pagination.items)
    //         console.log(`  prev:${pagination.prev}`)
    //         console.log(`  next:${pagination.next}`)
    //     }
    // }
</script>

<svelte:head>
    <title>Artifact Collection | Aerial - Extract dominant colors on image and document files</title>
    <link rel="alternate" hreflang="en" href="https://www-staging.pingsailor.com/artifact-collections/{$page.data?.artifactCollection?.id}" />
    <link rel="canonical" href="https://www-staging.pingsailor.com/artifact-collections/{$page.data?.artifactCollection?.id}"/>
</svelte:head>

<main class="lg:px-[3rem]">
    <section class="py-4 space-y-8">
        <div class="space-y-2">
            <h1 class="font-sculpin text-3xl">Artifact Collection</h1>
            <p>ID: { $page.data?.artifactCollection?.id }</p>
        </div>

        <div class="space-y-4">
            {#each $page.data?.artifacts ?? [] as artifact, artifactIndex}
                {#each artifact?.pages ?? [] as image, pageIndex}
                    <div class="grid place-items-center">
                        <figure class="space-y-2">
                            <img loading="lazy" src={image.url} alt={artifact.label} class="img-preview mx-auto" />

                            <figcaption class="text-center">
                                <div>{artifact.label}</div>
                                <div>
                                <!-- {artifact.type === 'DOCUMENT'
                                    ? `item ${artifactIndex + 1} page ${pageIndex + 1} of ${artifact.pages.length}`
                                    : `item ${artifactIndex + 1}`} -->
                                {image?.description}
                                </div>
                            </figcaption>
                        </figure>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {#each image?.colors ?? [] as pallete}
                            <div>
                                <div style="background-color: {pallete.color}; border: 1px solid rgb(203 213 225);" class="p-4"></div>
                                <div>Hex: { pallete.hex }</div>
                                <div>RGB: { pallete.rgb }</div>
                                <div>CMYK: { pallete.cmyk }</div>
                                <div>{ pallete.percentage }%</div>
                            </div>
                        {/each}
                    </div>

                    <div class="py-4 space-y-4">
                        <div>
                            <div>CMYK Total</div>
                            <small>Each number stands for the sum of C, M, Y and K in respective order from left to right.</small>
                        </div>
                        <div class="cmyk-total">
                            {image?.cmyk?.total}
                        </div>

                        <div>
                            <div>CMYK Summary</div>
                            <div><small>Formula: ((cmyk total / non-white colors length) / 100) * (colored space / 100) * 100</small></div>
                        </div>
                        <div class="cmyk-summary grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="cyan group relative flex items-center gap-2">
                                <div class="w-20 text-slate-700 bg-cyan-400 border border-slate-500 px-2 py-0.5">Cyan</div>
                                <div class="value">{`${image?.cmyk?.summary.c.value}%`}</div>
                                <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                    {image?.cmyk?.summary.c.formula}
                                </div>
                            </div>
                            <div class="magenta group relative flex items-center gap-2">
                                <div class="w-20 bg-pink-600 text-white border border-slate-500 px-2 py-0.5">Magenta</div>
                                <div class="value">{`${image?.cmyk?.summary.m.value}%`}</div>
                                <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                    {image?.cmyk?.summary.m.formula}
                                </div>
                            </div>
                            <div class="yellow group relative flex items-center gap-2">
                                <div class="w-20 text-slate-700 bg-yellow-300 border border-slate-500 px-2 py-0.5">Yellow</div>
                                <div class="value">{`${image?.cmyk?.summary.y.value}%`}</div>
                                <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                    {image?.cmyk?.summary.y.formula}
                                </div>
                            </div>
                            <div class="key group relative flex items-center gap-2">
                                <div class="w-20 bg-black text-white border border-slate-500 px-2 py-0.5">Key</div>
                                <div class="value">{`${image?.cmyk?.summary.k.value}%`}</div>
                                <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                    {image?.cmyk?.summary.k.formula}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div>Color Distribution</div>
                            <ul>
                                <li><small>*White space is percentage of cmyk 0 0 0 0 color range (close to white or #ffffff) found by kmeans_colors</small></li>
                                <li><small>*Colored space is 100 - white space</small></li>
                            </ul>
                        </div>
                        <div class="color-distribution grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="flex items-center gap-2">
                                <div class="w-20 text-slate-700 bg-white border border-slate-500 px-2 py-0.5">White</div> {image?.cmyk?.whiteSpace}%
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-20 bg-gradient-to-br from-rose-500 via-violet-500 to-sky-500 text-white border border-slate-500 px-2 py-0.5">Colored</div> {image?.cmyk?.coloredSpace}%
                            </div>
                        </div>
                    </div>
                {/each}

                {#if artifact?.pagination}
                    <div class="flex items-center justify-between py-3">
                        <!-- Mobile -->
                        <div class="flex flex-1 justify-end gap-4 sm:hidden">
                            <a href={`/artifact-collections/${$page.data?.artifactCollection?.id}?paginate=item:${artifactIndex + 1},page:${artifact.pagination.previousPage},limit:10`}
                                class="text-slate-700 dark:text-indigo-200 rounded-md border-2 border-indigo-300 px-2 py-1 outline-none hover:border-indigo-500 focus:border-indigo-500 focus:text-indigo-500">
                                Previous
                            </a>
                            <a href={`/artifact-collections/${$page.data?.artifactCollection?.id}?paginate=item:${artifactIndex + 1},page:${artifact.pagination.nextPage},limit:10`}
                                class="text-slate-700 dark:text-indigo-200 rounded-md border-2 border-indigo-300 px-2 py-1 outline-none hover:border-indigo-500 focus:border-indigo-500 focus:text-indigo-500">
                                Next
                            </a>
                        </div>
                        <!-- Desktop -->
                        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p class="text-sm text-gray-700 dark:text-white">
                                    {artifact?.pagination?.info}
                                </p>
                            </div>
                            <div class="pagination flex items-center gap-4 text-lg">
                                <nav class="isolate inline-flex rounded-md border-2 border-indigo-300" aria-label="Pagination">
                                    <!-- Previous link -->
                                    <a href={`/artifact-collections/${$page.data?.artifactCollection?.id}?paginate=item:${artifactIndex + 1},page:${artifact.pagination.previousPage},limit:10`} class="inline-flex items-center rounded-l text-slate-700 dark:text-indigo-200 px-2 py-1 outline-none hover:bg-indigo-500 focus:bg-indigo-600 hover:text-white focus:text-white">
                                        <span class="sr-only">Previous</span>
                                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                                        </svg>
                                    </a>
                                    <!-- Page links -->
                                    {#each paginate({ current: artifact.pagination.currentPage, max: artifact.pagination.totalPages }).items as number, i}
                                        {#if number === "…"}
                                            <div class="inline-flex items-center px-2.5 py-1">{ number }</div>
                                        {:else}
                                        <a href={`/artifact-collections/${$page.data?.artifactCollection?.id}?paginate=item:${artifactIndex + 1},page:${number},limit:10`}
                                            aria-current="page"
                                            class="inline-flex items-center px-2.5 py-1 outline-none {artifact.pagination.currentPage === i + 1 ? 'text-white dark:text-slate-800 dark:hover:text-white bg-indigo-500 dark:bg-indigo-300 hover:bg-indigo-600 focus:bg-indigo-600' : 'hover:text-white focus:text-white hover:bg-indigo-400 focus:bg-indigo-600'}">
                                            { number }
                                        </a>
                                        {/if}
                                    {/each}
                                    <!-- Next link -->
                                    <a href={`/artifact-collections/${$page.data?.artifactCollection?.id}?paginate=item:${artifactIndex + 1},page:${artifact.pagination.nextPage},limit:10`} class="inline-flex items-center rounded-r text-slate-700 dark:text-indigo-200 px-2 py-1 outline-none hover:bg-indigo-500 focus:bg-indigo-600 hover:text-white focus:text-white">
                                        <span class="sr-only">Next</span>
                                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                                        </svg>
                                    </a>
                                </nav>
                            </div>
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
    </section>
</main>
