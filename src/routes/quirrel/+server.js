import { Queue } from 'quirrel/sveltekit'
import { writeFile, appendFile } from 'node:fs/promises'
import { storage_path } from "$lib/config.js"
import prisma, { mimetypeMapToEnum, mimetypeMapFromEnum } from '$lib/prisma.js'
import { getFileExtension } from '$lib/aerial/hybrid/util.js'
import { kmeansColors, summary } from '$lib/aerial/server/index.js'

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
    async (artifactCollectionId, meta) => {
        /**
         * Perform kmeans_colors and save to database
         * Get artifact collection instance
         */
        const artifactCollection = await prisma.artifactCollection.findFirst({
            where: {
                id: artifactCollectionId
            },
            include: {
                artifacts: true
            }
        })
        // test that queue job is invoked
        //await writeFile(`${storage_path}/aerial/${artifactCollection.id}/test.json`, JSON.stringify(artifactCollection, null, 4))

        const artifacts = artifactCollection.artifacts

        artifacts.forEach(async (artifact) => {
            // test loop
            // await appendFile(`${storage_path}/aerial/${artifactCollection.id}/artifacts.txt`, artifact.id)
            const colors = await kmeansColors(`${storage_path}/aerial/${artifactCollection.id}/${artifact.id}${getFileExtension(mimetypeMapFromEnum[artifact.mimetype])}`)
            // await writeFile(`${storage_path}/aerial/${artifactCollection.id}/kmeans.json`, JSON.stringify(colors, null, 4))

            // const kmeansColor = await prisma.kmeansColors.findFirst({
            //     where: {
            //         id: 'kc_Jel4oz'
            //     }
            // })
            // await writeFile(`${storage_path}/aerial/${artifactCollection.id}/kmeans.json`, JSON.stringify(kmeansColor, null, 4))

            // const cmykData = await summary(kmeansColor.colors)
            // console.log('cmykData: ', cmykData)
            // await writeFile(`${storage_path}/aerial/${artifactCollection.id}/cmyk.json`, JSON.stringify(cmykData, null, 4))

            const kmeansColor = await prisma.kmeansColors.create({
                data: {
                    artifactId: artifact.id,
                    colors
                }
            })

            const cmykData = await summary(kmeansColor.colors)

            const cmyk = await prisma.cMYK.create({
                data: {
                    artifactId: artifact.id,
                    total: cmykData.total,
                    whiteSpace: cmykData.whiteSpace,
                    coloredSpace: cmykData.coloredSpace,
                    summary: cmykData.summary
                }
            })

            await prisma.artifact.update({
                where: {
                    id: artifact.id
                },
                data: {
                    url: `/storage/aerial/${artifactCollectionId}/${artifact.id}.png`,
                    kmeansColorsId: kmeansColor.id,
                    cmykId: cmyk.id
                }
            })
        })
    }
)

export const POST = queue

// Error: Invalid export 'default' in src/routes/quirrel/+server.js (valid exports are GET, POST, PATCH, PUT, DELETE, OPTIONS, prerender, trailingSlash, config, or anything with a '_' prefix)
// export default queue
