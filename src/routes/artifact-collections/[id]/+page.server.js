import prisma, { mimetypeMapToEnum } from '$lib/prisma.js'

export const load = async ({ params }) => {
    console.log(`ID: ${params.id}`)
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
    console.log(`artifactCollection: ${JSON.stringify(artifactCollection, null, 4)}`)

    return {
        artifactCollection
    }
}
