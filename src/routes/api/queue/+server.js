import { json, error } from "@sveltejs/kit"
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import prisma, { mimetypeMapToEnum } from '$lib/prisma.js'
import { storage_path, GlobalOAuth2Client } from "$lib/config.js"
import { POST as quirrel } from '../quirrel/job/color-extraction/+server.js'
import { fileCheck, emptyFile } from '$lib/aerial/hybrid/validation.js'
import { getFileExtension } from '$lib/aerial/hybrid/util.js'
import { airy } from "$lib/aerial/hybrid/util.js"

/**
 * NOTE: This has been moved to /src/routes/queue/+page.server.js default form action
 * 
 * Request sent in this endpoint is passed to Quirrel Queue instance
 * defined in /src/routes/quirrel/+serve.js
 * 
 * Sample code
 * https://github.com/quirrel-dev/quirrel/blob/main/examples/sveltekit/src/routes/enqueueGreeting/%2Bserver.ts
 */

/**
 * TODO: change this to accept valid API requests
 * 
 * https://reqbin.com/req/c-dot4w5a2/curl-post-file
 * curl --include -X POST "localhost:5173/api/queue" -H "Accept: application/json" -d @debug/ceres_fauna_card.jpeg
 * curl --include -X POST "localhost:5173/api/queue" -H "Accept: application/json" -H "Authorization: Bearer <TOKEN_HERE>" -F "file=@debug/BK2o1_Resume_Nov2016.docx;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document" --verbose
 * 
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const POST = async ({ request, locals }) => {
    try {
        /**
         * For some reason if we don't do await request.formData(), we get Send failure: Broken pipe
         * from request.
         */
        const formData = await request.formData()
        const files = Array.from(formData.getAll('file'))
        airy({ topic: 'quirrel', message: files })

        // Do nothing and return empty array if file input is empty
        if (emptyFile(files[0])) return json({  })

        // Create a collection for this batch
        const collection = await prisma.artifactCollection.create({
            data: {
                label: formData.get('label') ?? ""
            }
        })

        /**
         * Create collection folder where we save the file(s) or image(s)
         */
        const collectionFolder = `${storage_path}/aerial/${collection.id}`
        await mkdir(collectionFolder, { recursive: true })

        for (let i = 0; i < files.length; i++) {
            // Get buffer and base64 from File/Blob
            const buffer = Buffer.from(await files[i].arrayBuffer())

            // server-side validation, never trust input from client
            if (fileCheck.isImage(files[i].type)) {
                airy({ topic: 'quirrel', message: `${files[i].name} is an image.` })

                const pngBuffer = await sharp(buffer)
                    .toFormat('png')
                    // resize images so we don't receive huge base64 string on the client which messes up svelte transition
                    .resize({ height: 240 })
                    // Remove transparent and replace with white background
                    .flatten({ background: '#FFFFFF' })
                    .toBuffer()
                const base64 = pngBuffer.toString('base64')
                airy({ topic: 'quirrel', message: `File ${files[i]}` })

                /**
                 * Save details about each file and assign collectionId
                 * so we can query it after quirrel is finished with queue
                 */
                airy({ topic: 'quirrel', message: `Label ${files[i].name.replace(getFileExtension(files[i].type), '.png')}` })
                airy({ topic: 'quirrel', message: `Extension ${getFileExtension(files[i].type)}` })
                const artifact = await prisma.artifact.create({
                    data: {
                        label: files[i].name
                            .replace(getFileExtension(files[i].type), '.png')
                            .replace('.jpg', '.png'),
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
                const imagepath = `${collectionFolder}/${artifact.id}_1.png`
                await writeFile(imagepath, pngBuffer, { flag: 'w+' })
            }

            if (fileCheck.isPdf(files[i].type) || fileCheck.isDoc(files[i].type)) {
                airy({ topic: 'quirrel', message: `${files[i].name} is a document file.` })

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
        }

        globalThis[GlobalOAuth2Client] = locals.googleOauthClient

        await quirrel.enqueue({ artifactCollectionId: collection.id })

        return json({
            status: 200,
            message: 'Successfully queued files for aerial processing.',
        })
    } catch (errorDetail) {
        airy({ message: errorDetail, label: '/api/queue POST:', action: 'error' })
        throw error(400, errorDetail.message)
    }
}
