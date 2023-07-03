import { mkdir, writeFile } from 'node:fs/promises'
import { fail, redirect } from '@sveltejs/kit'
import sharp from 'sharp'
import prisma, { mimetypeMapToEnum } from '$lib/prisma.js'
import { storage_path } from "$lib/config.js"
import { POST as quirrel } from '../quirrel/+server.js'
import { fileCheck, emptyFile } from '$lib/aerial/hybrid/validation.js'
import { getFileExtension } from '$lib/aerial/hybrid/util.js'

/**
 * @type {import('@sveltejs/kit').ServerLoad} 
 */
export const load = async ({ locals, depends }) => {
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
                    kmeansColors: true,
                    cmyk: true
                }
            }
        }
    })

    depends('queue:artifactCollections')

    return {
        artifacts,
        artifactCollections,
    }
}

/**
 * @type {import('@sveltejs/kit').Actions}
 */
export const actions = {
    default: async ({ request, locals, cookies }) => {
        try {
            const formData = await request.formData()
            const files = Array.from(formData.getAll('file'))

            let images = []

            // Do nothing and return empty array if file input is empty
            if (emptyFile(files[0])) return {  }

            // Create a collection for this batch
            const collection = await prisma.artifactCollection.create({
                data: {
                    label: formData.get('label')
                }
            })

            /**
             * Create collection folder where we save the file(s) or image(s)
             */
            const collectionFolder = `${storage_path}/aerial/${collection.id}`
            // console.log('collectionFolder: ', collectionFolder)
            await mkdir(collectionFolder, { recursive: true })

            for (let i = 0; i < files.length; i++) {
                // Get buffer and base64 from File/Blob
                const buffer = Buffer.from(await files[i].arrayBuffer())

                // server-side validation, never trust input from client
                if (fileCheck.isImage(files[i].type)) {
                    console.log(`${files[i].name} is an image.`)

                    const pngBuffer = await sharp(buffer)
                        .toFormat('png')
                        // resize images so we don't receive huge base64 string on the client which messes up svelte transition
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
                        // type: files[i].type,
                        type: 'image/png',
                        name: files[i].name
                    }

                    /**
                     * Save details about each file and assign collectionId
                     * so we can query it after quirrel is finished with queue
                     */
                    console.log('label: ', files[i].name.replace(getFileExtension(files[i].type), '.png'))
                    console.log('extension: ', getFileExtension(files[i].type))
                    const artifact = await prisma.artifact.create({
                        data: {
                            label: files[i].name
                                .replace(getFileExtension(files[i].type), '.png')
                                .replace('.jpg', '.png'),
                            // mimetype: mimetypeMapToEnum[files[i].type],
                            mimetype: 'IMAGE_PNG',
                            type: 'IMAGE',
                            collectionId: collection.id
                        }
                    })

                    /**
                     * Save file(s) or image(s) in collection folder
                     * NOTE: _1 on filename is required for images since we assume all artifacts may have multiple pages
                     * Is there a way to not hard code this sorcery?
                     */
                    // const imagepath = `${collectionFolder}/${artifact.id}${getFileExtension(files[i].type)}`
                    // await writeFile(imagepath, buffer, { flag: 'w+' })
                    const imagepath = `${collectionFolder}/${artifact.id}_1.png`
                    await writeFile(imagepath, pngBuffer, { flag: 'w+' })

                    images.push(image)
                }

                if (fileCheck.isPdf(files[i].type) || fileCheck.isDoc(files[i].type)) {
                    console.log(`${files[i].name} is a document file.`)

                    const artifact = await prisma.artifact.create({
                        data: {
                            label: files[i].name,
                            mimetype: mimetypeMapToEnum[files[i].type],
                            type: 'DOCUMENT',
                            collectionId: collection.id
                        }
                    })

                    const filepath = `${collectionFolder}/${artifact.id}${getFileExtension(files[i].type)}`
                    await writeFile(filepath, buffer, { flag: 'w+' })
                }

                // if (fileCheck.isDoc(files[i].type)) {
                //     console.log(`${files[i].name} is a word document.`)
                // }
            }

            /**
             * Queue the created collection, no need to queue each artifacts
             * as they hold many information that may lead to out of ram if we
             * have many pending queues
             */
            // const dummyCollection = {"id":"artc_4TUQdI","label":"test","createdAt":"2023-05-06T03:42:07.880Z","updatedAt":"2023-05-06T03:42:07.880Z"}
            // await quirrel.enqueue(dummyCollection.id, {
            //     delay: '1h'
            // })
            await quirrel.enqueue({ artifactCollectionId: collection.id, locals }, {
                // delay: '1h' // if delay if not specified, quirrel runs the job ASAP
            })

            return {
                images
            }
        } catch (error) {
            console.log(error)
            return fail(422, error)
        }
    }
}
