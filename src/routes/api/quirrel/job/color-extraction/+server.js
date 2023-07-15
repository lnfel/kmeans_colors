/**
 * SvelteKit build crash with Quirrel import
 * https://github.com/quirrel-dev/quirrel/issues/1111#issuecomment-1365873921
 */
// import { Queue } from 'quirrel/sveltekit'
import { Queue } from 'quirrel/sveltekit.cjs'
import { getOAuth2Client, isSignedIn } from 'svelte-google-auth'
import { writeFile, readFile } from 'node:fs/promises'
import { storage_path } from '$lib/config.js'
import prisma, { mimetypeMapToEnum, mimetypeMapFromEnum } from '$lib/prisma.js'
import { getFileExtension } from '$lib/aerial/hybrid/util.js'
import { fileCheck } from '$lib/aerial/hybrid/validation.js'
import { kmeansColors, summary } from '$lib/aerial/server/index.js'
import mupdf from 'mupdf'
import { GlobalRabbitChannel } from '$lib/rabbitmq/utils.js'
import { rabbitDefaultQueue } from '$lib/rabbitmq/index.js'
import { airy } from '$lib/aerial/hybrid/util.js'

/**
 * This route is dedicated to handling queues added in /api/queue to Quirrel Queue
 * https://docs.quirrel.dev/api/sveltekit
 * 
 * This route endpoint is not supposed to receive requests,
 * to add items to queue make another endpoint or use a form action to send the request and 
 * import queue from this file, then call .enqueue method.
 * 
 * Sample code
 * https://github.com/quirrel-dev/quirrel/blob/main/examples/sveltekit/src/routes/greetingsQueue/%2Bserver.ts
 * 
 * To see pending queues visit https://ui.quirrel.dev/ and use connect to localhost
 */
const queue = Queue(
    'api/quirrel/job/color-extraction',
    async (job, meta) => {
        /**
         * Perform kmeans_colors and save to database
         * Get artifact collection instance
         */
        const artifactCollection = await prisma.artifactCollection.findFirst({
            where: {
                id: job.artifactCollectionId
            },
            include: {
                artifacts: true
            }
        })

        const artifacts = artifactCollection.artifacts

        artifacts.forEach(async (artifact) => {
            // Check mimetype and process color extraction based on type of file

            airy({ topic: 'quirrel', message: artifact, label: 'Artifact:' })

            const filepath = `${storage_path}/aerial/${artifactCollection.id}/${artifact.id}_1${getFileExtension(mimetypeMapFromEnum[artifact.mimetype])}`
            const kmeans_colors = []

            if (fileCheck.isImage(mimetypeMapFromEnum[artifact.mimetype])) {
                // If we are working with image file, extract colors right away
                const color = await kmeansColors(filepath)
                kmeans_colors.push(color)

                const kmeansColor = await prisma.kmeansColors.create({
                    data: {
                        artifactId: artifact.id,
                        colors: kmeans_colors
                    }
                })

                const cmykData = await summary(kmeansColor.colors)

                const cmyk = await prisma.cMYK.create({
                    data: {
                        artifactId: artifact.id,
                        info: cmykData
                    }
                })

                await prisma.artifact.update({
                    where: {
                        id: artifact.id
                    },
                    data: {
                        url: `/storage/aerial/${job.artifactCollectionId}/${artifact.id}_1.png`,
                        kmeansColorsId: kmeansColor.id,
                        cmykId: cmyk.id,
                        pages: 1
                    }
                })
            }

            if (fileCheck.isPdf(mimetypeMapFromEnum[artifact.mimetype])) {
                /**
                 * MuPDF WASM
                 * https://mupdf.readthedocs.io/en/latest/mupdf-wasm.html
                 * https://mupdf.readthedocs.io/en/latest/mupdf-js.html
                 */
                mupdf.ready.then(async () => {
                    const before = performance.now()
                    const pdfBuffer = await readFile(filepath.replace('_1', ''))

                    const mupdfDocument = mupdf.Document.openDocument(pdfBuffer, mimetypeMapFromEnum[artifact.mimetype])
                    const pages = mupdfDocument.countPages()
                    console.log("MuPDF document: ", mupdfDocument)
                    console.log("Pages: ", pages)

                    // Convert each page to png image and save to storage
                    for (let i = 0; i < pages; i++) {
                        const page = mupdfDocument.loadPage(i)
                        // const pixmap = page.toPixmap(mupdf.Matrix.identity, mupdf.ColorSpace.DeviceRGB, false)
                        const pixmap = page.toPixmap(mupdf.Matrix.scale(0.5, 0.5), mupdf.ColorSpace.DeviceRGB, false)
                        // pixmap.setResolution(300, 300)
                        await writeFile(`${storage_path}/aerial/${artifactCollection.id}/${artifact.id}_${i + 1}.png`, pixmap.asPNG(), { flag: 'w+' })
                    }

                    // Extract colors
                    for (let i = 0; i < pages; i++) {
                        const color = await kmeansColors(`${storage_path}/aerial/${artifactCollection.id}/${artifact.id}_${i + 1}.png`)
                        kmeans_colors.push(color)
                    }

                    const kmeansColor = await prisma.kmeansColors.create({
                        data: {
                            artifactId: artifact.id,
                            colors: kmeans_colors
                        }
                    })

                    const cmykData = await summary(kmeansColor.colors)

                    const cmyk = await prisma.cMYK.create({
                        data: {
                            artifactId: artifact.id,
                            info: cmykData
                        }
                    })

                    await prisma.artifact.update({
                        where: {
                            id: artifact.id
                        },
                        data: {
                            url: `/storage/aerial/${job.artifactCollectionId}/${artifact.id}.pdf`,
                            kmeansColorsId: kmeansColor.id,
                            cmykId: cmyk.id,
                            pages
                        }
                    })

                    const after = performance.now()
                    airy({ topic: 'quirrel', message: `PDF color extraction done in ${((after - before) / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} s` })
                    // https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-218.php
                    airy({ topic: 'quirrel', message: `${((1000 * pages) / (after - before)).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} page(s) processed per second` })
                    airy({ topic: 'quirrel', message: `${((30000 * pages) / (after - before)).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} page(s) processed per 30 seconds` })
                })
            }

            if (fileCheck.isDoc(mimetypeMapFromEnum[artifact.mimetype])) {
                // make a request to googleDrive API
                if (isSignedIn(job.locals)) {
                    console.log('isSignedIn: ', isSignedIn(job.locals))
                    const split = 262144 // This is a sample chunk size. https://stackoverflow.com/a/73264129/12478479
                }
            }

            await prisma.artifactCollection.update({
                where: {
                    id: job.artifactCollectionId
                },
                data: {
                    processed: true
                }
            })

            /**
             * @type {import('amqplib').Channel}
             */
            const rabbitChannel = globalThis[GlobalRabbitChannel]
            if (rabbitChannel) {
                rabbitChannel.sendToQueue(rabbitDefaultQueue, Buffer.from(job.artifactCollectionId))
                airy({ topic: 'quirrel', message: `Sending notification to rabbit queue (${job.artifactCollectionId})`, action: 'executing' })
            } else {
                airy({ topic: 'quirrel', message: `Rabbitmq channel not detected, please make sure we are connected to Rabbitmq server and a channel is created.`, action: 'error' })
            }
        })
    }
)

export const POST = queue

// Error: Invalid export 'default' in src/routes/quirrel/+server.js (valid exports are GET, POST, PATCH, PUT, DELETE, OPTIONS, prerender, trailingSlash, config, or anything with a '_' prefix)
// export default queue
