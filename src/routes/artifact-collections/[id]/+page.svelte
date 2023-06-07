<script>
    import { page } from "$app/stores"
</script>

<main class="lg:px-[3rem]">
    <section>
        <div class="space-y-4">
            {#each $page.data?.artifactCollection?.artifacts ?? [] as artifact}
                <div class="grid place-items-center">
                    <figure class="space-y-2">
                        <img src={`/storage/aerial/${$page.data?.artifactCollection?.id}/${artifact.id}.png`} alt={artifact.label} class="mx-auto" />

                        <figcaption class="text-center">
                            <div>{artifact.label}</div>
                        </figcaption>
                    </figure>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {#each artifact?.kmeansColors?.colors ?? [] as pallete}
                        <div>
                            <div style="background-color: {pallete.color}; border: 1px solid rgb(203 213 225);" class="p-4"></div>
                            <div>Hex: { pallete.hex }</div>
                            <div>RGB: { pallete.rgb }</div>
                            <div>CMYK: { pallete.cmyk }</div>
                            <div>{ pallete.percentage }%</div>
                        </div>
                    {/each}
                </div>

                {#if artifact?.cmyk}
                    <div class="py-4 space-y-4">
                        <div>
                            <div>CMYK Total</div>
                            <small>Each number stands for the sum of C, M, Y and K in respective order from left to right.</small>
                        </div>
                        <div class="cmyk-total">
                            {artifact.cmyk.total}
                        </div>

                        <div>
                            <div>CMYK Summary</div>
                            <div><small>Formula: ((cmyk total / non-white colors length) / 100) * (colored space / 100) * 100</small></div>
                        </div>
                        <div class="cmyk-summary grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="cyan group relative flex items-center gap-2">
                                <div class="w-20 text-slate-700 bg-cyan-400 border border-slate-500 px-2 py-0.5">Cyan</div>
                                <div class="value">{`${artifact.cmyk.summary.c.value}%`}</div>
                                <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                    {artifact.cmyk.summary.c.formula}
                                </div>
                            </div>
                            <div class="magenta group relative flex items-center gap-2">
                                <div class="w-20 bg-pink-600 text-white border border-slate-500 px-2 py-0.5">Magenta</div>
                                <div class="value">{`${artifact.cmyk.summary.m.value}%`}</div>
                                <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                    {artifact.cmyk.summary.m.formula}
                                </div>
                            </div>
                            <div class="yellow group relative flex items-center gap-2">
                                <div class="w-20 text-slate-700 bg-yellow-300 border border-slate-500 px-2 py-0.5">Yellow</div>
                                <div class="value">{`${artifact.cmyk.summary.y.value}%`}</div>
                                <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                    {artifact.cmyk.summary.y.formula}
                                </div>
                            </div>
                            <div class="key group relative flex items-center gap-2">
                                <div class="w-20 bg-black text-white border border-slate-500 px-2 py-0.5">Key</div>
                                <div class="value">{`${artifact.cmyk.summary.k.value}%`}</div>
                                <div class="formula invisible group-hover:visible absolute bottom-[125%] whitespace-nowrap bg-slate-800 text-white dark:bg-white dark:text-slate-800 rounded px-2 py-0.5 after:content[''] after:absolute after:top-full after:left-1/2 after:border-8 after:border-solid after:border-transparent after:border-t-slate-800 after:dark:border-t-white">
                                    {artifact.cmyk.summary.k.formula}
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
                                <div class="w-20 text-slate-700 bg-white border border-slate-500 px-2 py-0.5">White</div> {artifact.cmyk.whiteSpace}%
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-20 bg-gradient-to-br from-rose-500 via-violet-500 to-sky-500 text-white border border-slate-500 px-2 py-0.5">Colored</div> {artifact.cmyk.coloredSpace}%
                            </div>
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
    </section>
</main>