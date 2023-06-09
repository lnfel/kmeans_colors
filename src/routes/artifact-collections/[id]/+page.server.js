import prisma from '$lib/prisma.js'
import { error } from '@sveltejs/kit'

export const load = async ({ params }) => {
    try {
        console.log(`artifact-collections ID: ${params.id}`)
    const artifactCollection = await prisma.artifactCollection.findFirstOrThrow({
        where: {
            id: params.id
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

    return {
        artifactCollection
        }
    } catch (errorMessage) {
        throw error(404, 'Artifact collection not found')
    }
}
