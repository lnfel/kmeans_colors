import { mkdir, writeFile } from 'node:fs/promises'
import { fail, redirect } from '@sveltejs/kit'
import sharp from 'sharp'
import prisma, { mimetypeMapToEnum } from '$lib/prisma.js'
import { storage_path } from "$lib/config.js"
import { POST as quirrel } from '../quirrel/+server.js'
import { fileCheck, emptyFile } from '$lib/aerial/hybrid/validation.js'
import { getFileExtension } from '$lib/aerial/hybrid/util.js'

export const load = async () => {
    // const job = await quirrel.getById('be501991-8c74-4af6-96b0-ea85e7f068c1')
    // console.log(job)
    // if(await job?.invoke()) {
    //     console.log('Job has been invoked.')
    // } else {
    //     console.log(`No job found with id of be501991-8c74-4af6-96b0-ea85e7f068c1.`)
    // }

    const artifacts = await prisma.artifact.findMany()
    const artifactCollections = await prisma.artifactCollection.findMany({
        include: {
            artifacts: {
                include: {
                    kmeansColors: true
                }
            }
        }
    })

    return {
        artifacts,
        artifactCollections
    }
}

export const actions = {
    default: async ({ request, locals, cookies }) => {
        try {
            const formData = await request.formData()
            const files = Array.from(formData.getAll('file'))

            let images = []

            // Do nothing and return empty array if file input is empty
            if (emptyFile(files[0])) return { queue }

            // Create a collection for this batch
            // const collection = await prisma.artifactCollection.create({
            //     data: {
            //         label: formData.get('label')
            //     }
            // })

            /**
             * Create collection folder where we save the file(s) or image(s)
             */
            // const collectionFolder = `${storage_path}/aerial/${collection.id}`
            // await mkdir(collectionFolder, { recursive: true })

            for (let i = 0; i < files.length; i++) {
                // server-side validation, never trust input from client

                // Get buffer and base64 from File/Blob
                const buffer = Buffer.from(await files[i].arrayBuffer())
                const pngBuffer = await sharp(buffer)
                    .toFormat('png')
                    // resize images we don't receive huge base64 string which messes up svelte transition
                    .resize({ height: 240 })
                    .toBuffer()
                const base64 = pngBuffer.toString('base64')
                console.log('file', files[i])

                /**
                 * Create image object and push it to queue
                 * We can also immediately use this to optionally a display preview
                 */
                const image = {
                    // base64: `data:${files[i].type};base64,${base64}`,
                    base64: `data:image/png;base64,${base64}`,
                    size: files[i].size,
                    type: files[i].type,
                    name: files[i].name
                }

                /**
                 * Save details about each file and assign collectionId
                 * so we can query it after quirrel is finished with queue
                 */
                // const artifact = await prisma.artifact.create({
                //     data: {
                //         label: files[i].name,
                //         mimetype: mimetypeMapToEnum[files[i].type],
                //         type: 'IMAGE',
                //         collectionId: collection.id
                //     }
                // })

                /**
                 * Save file(s) or image(s) in collection folder
                 */
                // const imagepath = `${collectionFolder}/${artifact.id}${getFileExtension(files[i].type)}`
                // await writeFile(imagepath, buffer, { flag: 'w+' })
                // await writeFile(imagepath, pngBuffer, { flag: 'w+' })

                images.push(image)
                // console.log(artifact)
            }

            /**
             * Queue the created collection, no need to queue each artifacts
             * as they hold many information that may lead to out of ram if we
             * have many pending queues
             */
            const dummyCollection = {"id":"artc_COI3rJ","label":"test","createdAt":"2023-05-06T03:42:07.880Z","updatedAt":"2023-05-06T03:42:07.880Z"}
            await quirrel.enqueue(dummyCollection.id, {
                delay: '1h'
            })
            // await quirrel.enqueue(collection.id, {
            //     delay: '1h'
            // })

            return {
                images
            }
        } catch (error) {
            console.log(error)
            return fail(422, error)
        }
    }
}
