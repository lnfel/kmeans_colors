/**
 * SvelteKit build crash with Quirrel import
 * https://github.com/quirrel-dev/quirrel/issues/1111#issuecomment-1365873921
 */
// import { Queue } from 'quirrel/sveltekit'
import { Queue } from 'quirrel/sveltekit.cjs'
import { readFile } from 'node:fs/promises'
import { storage_path, GlobalOAuth2Client } from '$lib/config.js'
import prisma, { mimetypeMapFromEnum } from '$lib/prisma.js'
import { getFileExtension } from '$lib/aerial/hybrid/util.js'
import { fileCheck } from '$lib/aerial/hybrid/validation.js'
import { kmeansColors, summary, googleDocToPdf, extractPdfColors } from '$lib/aerial/server/index.js'
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
                extractPdfColors({
                    pdfBuffer: await readFile(filepath.replace('_1', '')),
                    mimetype: mimetypeMapFromEnum[artifact.mimetype],
                    artifactCollection,
                    artifact
                })
            }

            if (fileCheck.isDoc(mimetypeMapFromEnum[artifact.mimetype])) {
                // make a request to googleDrive API
                airy({ topic: 'quirrel', message: 'Logged in with google' })
                const before = performance.now()
                const convertedDoc = await googleDocToPdf({
                    filepath,
                    mimetype: mimetypeMapFromEnum[artifact.mimetype],
                    artifact
                })
                const pdfBuffer = Buffer.from(convertedDoc.base64PDF.replace('data:application/pdf;base64,', ''), 'base64')
                extractPdfColors({
                    pdfBuffer,
                    mimetype: 'application/pdf',
                    artifactCollection,
                    artifact
                })
                const after = performance.now()
                airy({ topic: 'quirrel', message: `Word doc color extraction done in ${((after - before) / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} s` })
            }

            await prisma.artifactCollection.update({
                where: {
                    id: job.artifactCollectionId
                },
                data: {
                    processed: true
                }
            })
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

        /** @type {import('ws').WebSocket} */
        const ws = globalThis[artifactCollection.label]
        if (ws) {
            ws.send(`color-extraction:done:${job.artifactCollectionId}`)
        }
    }
)

export const POST = queue

// Error: Invalid export 'default' in src/routes/quirrel/+server.js (valid exports are GET, POST, PATCH, PUT, DELETE, OPTIONS, prerender, trailingSlash, config, or anything with a '_' prefix)
// export default queue
