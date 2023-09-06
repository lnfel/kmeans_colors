import { json, error } from '@sveltejs/kit'
import prisma from '$lib/prisma.js'

/**
 * Get artifacts data based on url search query parameters
 * 
 * Sample curl request:
 * ```
 * curl --inlcude -X GET "localhost:5173/api/artifacts?label=gp_o1XliK.png" -H "Accept: application/json"
 * ```
 * 
 * @type {import('@sveltejs/kit').RequestHandler}
 * @returns {Promise<Aerial.Artifact>} Artifact
 */
export async function GET({ params, url }) {
    try {
        const label = url.searchParams.get('label')
        const artifact = await prisma.artifact.findFirstOrThrow({
            where: {
                label
            },
            include: {
                kmeansColors: true,
                cmyk: true
            }
        }).catch(() => { throw error(404, 'Artifact not found') })

        return json(artifact)
    } catch (errorMessage) {
        throw error(errorMessage.status ?? 400, errorMessage.body)
    }
}
