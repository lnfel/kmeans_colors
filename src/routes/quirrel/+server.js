/**
 * SvelteKit build crash with Quirrel import
 * https://github.com/quirrel-dev/quirrel/issues/1111#issuecomment-1365873921
 */
// import { Queue } from 'quirrel/sveltekit'
import { Queue } from 'quirrel/sveltekit.cjs'
import { getOAuth2Client, isSignedIn } from 'svelte-google-auth'
import { writeFile, appendFile, readFile } from 'node:fs/promises'
import { storage_path } from '$lib/config.js'
import prisma, { mimetypeMapToEnum, mimetypeMapFromEnum } from '$lib/prisma.js'
import { getFileExtension } from '$lib/aerial/hybrid/util.js'
import { fileCheck } from '$lib/aerial/hybrid/validation.js'
import { kmeansColors, summary } from '$lib/aerial/server/index.js'
import mupdf from 'mupdf'

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
    'quirrel',
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

            console.log("Quirrel queue artifact: ", artifact)
            // console.log("Original mimetype: ", mimetypeMapFromEnum[artifact.mimetype])
            // console.log("File extension: ", getFileExtension(mimetypeMapFromEnum[artifact.mimetype]))

            const filepath = `${storage_path}/aerial/${artifactCollection.id}/${artifact.id}_1${getFileExtension(mimetypeMapFromEnum[artifact.mimetype])}`
            const kmeans_colors = []

            if (fileCheck.isImage(mimetypeMapFromEnum[artifact.mimetype])) {
                // If we are working with image file, extract colors right away
                const color = await kmeansColors(filepath)
                kmeans_colors.push(color)
                // await writeFile(`${storage_path}/aerial/${artifactCollection.id}/kmeans.json`, JSON.stringify(colors, null, 4))

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
                })
            }

            if (fileCheck.isDoc(mimetypeMapFromEnum[artifact.mimetype])) {
                // make a request to googleDrive API
                if (isSignedIn(job.locals)) {
                    console.log('isSignedIn: ', isSignedIn(job.locals))
                    const split = 262144 // This is a sample chunk size. https://stackoverflow.com/a/73264129/12478479
                }
            }
        })
    }
)

export const POST = queue

// Error: Invalid export 'default' in src/routes/quirrel/+server.js (valid exports are GET, POST, PATCH, PUT, DELETE, OPTIONS, prerender, trailingSlash, config, or anything with a '_' prefix)
// export default queue
