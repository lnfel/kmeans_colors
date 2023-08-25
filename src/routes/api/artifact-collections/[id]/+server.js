import { json, error } from '@sveltejs/kit'
import prisma from '$lib/prisma.js'
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
 * curl -inlcude -X GET "localhost:5173/api/artifact-collections/artc_vhXpCQ" -H "Accept: application/json"
 * 
 * @type {import('@sveltejs/kit').RequestHandler}
 * @returns {JSON} ArtifactCollection
 */
export async function GET({ params, url }) {
    try {
        const artifactCollection = await prisma.artifactCollection.findFirstOrThrow({
            where: {
                id: params.id
            }
        }).catch(() => { throw error(404, 'Artifact collection not found') })

        const artifacts = await prisma.artifact.findMany({
            where: {
                collectionId: params.id
            },
            include: {
                kmeansColors: true,
                cmyk: true
            }
        })

        let formattedArtifacts = artifacts.map((artifact, artifactIndex) => {
            let pages = []

            for (let pageIndex = 0; pageIndex < artifact.pages; pageIndex++) {
                const page = {
                    url: artifact.url.replace('.pdf', `_${pageIndex + 1}.png`),
                    colors: artifact.kmeansColors.colors[pageIndex],
                    cmyk: {
                        total: artifact.cmyk.info.total[pageIndex],
                        summary: artifact.cmyk.info.summary[pageIndex],
                        whiteSpace: artifact.cmyk.info.whiteSpace[pageIndex],
                        coloredSpace: artifact.cmyk.info.coloredSpace[pageIndex],
                    },
                    description: artifact.type === 'DOCUMENT'
                        ? `item ${artifactIndex + 1} page ${pageIndex + 1} of ${artifact.pages}`
                        : `item ${artifactIndex + 1}`
                }
                pages.push(page)
            }
            return {
                ...{
                    id: artifact.id,
                    label: artifact.label,
                    type: artifact.type,
                    created_at: artifact.createdAt.toLocaleString('en-PH', {timezone: 'Asia/Manila', hour12: true, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})
                        .toUpperCase()
                        .replaceAll(/(,)|([.])/g, '')
                        .replaceAll(/\s+/g, ' ')
                        .replaceAll(/\//g, '-'),
                    updated_at: artifact.updatedAt.toLocaleString('en-PH', {timezone: 'Asia/Manila', hour12: true, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})
                        .toUpperCase()
                        .replaceAll(/(,)|([.])/g, '')
                        .replaceAll(/\s+/g, ' ')
                        .replaceAll(/\//g, '-')
                },
                pages
            }
        })

        return json({
            ...artifactCollection,
            artifacts: formattedArtifacts
        })
    } catch (errorMessage) {
        throw error(errorMessage.status ?? 400, errorMessage.body)
    }
}

/**
 * Delete artifact collection data based on id
 * 
 * Sample curl request:
 * curl -inlcude -X DELETE "localhost:5173/api/artifact-collections/artc_kR8qUu" -H "Accept: application/json"
 * 
 * Delete if exist does not exist at the moment, use catch to handle error gracefully
 * https://github.com/prisma/prisma/issues/4072#issuecomment-1127067981
 * 
 * @type {import('@sveltejs/kit').RequestHandler}
 * @returns {JSON} ArtifactCollection
 */
export async function DELETE({ params, url }) {
    try {
        const deleteArtifactCollection = await prisma.artifactCollection.delete({
            where: {
                id: params.id,
            },
        }).catch(() => { throw error(404, 'Artifact collection not found') })

        // const transaction = await prisma.$transaction([deleteArtifacts, deleteArtifactCollection])
        const transaction = await prisma.$transaction([deleteArtifactCollection])
        await rm(`${storage_path}/aerial/${params.id}`, { force: true, recursive: true })

        return json({ message: `Artifact collection ${params.id} has been deleted.` })
    } catch (errorMessage) {
        throw error(errorMessage.status ?? 400, errorMessage.body)
    }
}
