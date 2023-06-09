import { json } from '@sveltejs/kit'
import prisma, { mimetypeMapToEnum } from '$lib/prisma.js'

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
    const artifactCollection = await prisma.artifactCollection.findFirstOrThrow({
        where: {
            id: url.pathname.replace('/artifact-collections/', '')
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
}
