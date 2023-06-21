import { json, error } from '@sveltejs/kit'
import prisma, { mimetypeMapToEnum } from '$lib/prisma.js'
import { rm } from "node:fs/promises"
import { storage_path } from '$lib/config.js'

/**
 * +server.js file serves as API only endpoint
 * https://kit.svelte.dev/docs/routing#server
 * 
 * Note: Requests must have an Accept header of application/json,
 * otherwise the request will be treated as page request.
 * https://kit.svelte.dev/docs/routing#server-content-negotiation
 */

/**
 * Get artifact collection data based on id
 * 
 * Sample curl request:
 * curl -inlcude -X GET "localhost:5173/artifact-collections/artc_IKpsX5" -H "Accept: application/json"
 * 
 * @returns {JSON} ArtifactCollection
 */
export async function GET({ request, url }) {
    const id = url.pathname.replace('/artifact-collections/', '')
    
    try {
        const artifactCollection = await prisma.artifactCollection.findFirstOrThrow({
            where: {
                id
            },
            include: {
                artifacts: {
                    include: {
                        kmeansColors: true,
                        cmyk: true
                    }
                }
            }
        })

        return json(artifactCollection)
    } catch (errorMessage) {
        throw error(404, `Artifact collection with id of ${id} does not exist.`)
    }
}

/**
 * Delete artifact collection data based on id
 * 
 * Sample curl request:
 * curl -inlcude -X DELETE "localhost:5173/artifact-collections/artc_kR8qUu" -H "Accept: application/json"
 * 
 * Delete if exist does not exist at the moment, use catch to handle error gracefully
 * https://github.com/prisma/prisma/issues/4072#issuecomment-1127067981
 * 
 * @returns {JSON} ArtifactCollection
 */
export async function DELETE({ request, url }) {
    const id = url.pathname.replace('/artifact-collections/', '')

    try {
        // const deleteArtifacts = prisma.artifact.deleteMany({
        //     where: {
        //         collectionId: id,
        //     },
        // })

        const deleteArtifactCollection = prisma.artifactCollection.delete({
            where: {
                id,
            },
        })

        // const transaction = await prisma.$transaction([deleteArtifacts, deleteArtifactCollection])
        const transaction = await prisma.$transaction([deleteArtifactCollection])
        await rm(`${storage_path}/aerial/${id}`, { force: true, recursive: true })

        return json({ message: `Artifact collection ${id} has been deleted.` })
    } catch (errorMessage) {
        throw error(404, `Artifact collection with id of ${id} does not exist.`)
    }
}
