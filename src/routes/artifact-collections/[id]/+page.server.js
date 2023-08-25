import prisma from '$lib/prisma.js'
import { error } from '@sveltejs/kit'

/**
 * @type {import('@sveltejs/kit').ServerLoad} 
 */
export const load = async ({ params, url }) => {
    try {
        console.log(`artifact-collections ID: ${params.id}`)
        const artifactCollection = await prisma.artifactCollection.findFirstOrThrow({
            where: {
                id: params.id
            }
        }).catch(() => { throw error(404, 'Artifact collection not found') })

        /**
         * https://ilikekillnerds.com/2020/09/how-to-paginate-an-array-in-javascript/
         * 
         * @param {Array} items
         * @param {Number} page
         * @param {Number} limit
         */
        const paginate = (items, page = 1, limit = 10) => {
            if (limit > 200) {
                throw error(400, "Bad Request")
            }
            let offset = limit * (page - 1)
            // offset cannot be equal or more than of items length
            offset = offset >= items.length ? 0 : offset
            const totalPages = Math.ceil(items.length / limit)
            const paginatedItems = items.slice(offset, limit * page)

            return {
                pages: paginatedItems,
                previousPage: page - 1 ? page - 1 : null,
                nextPage: (totalPages > page) ? page + 1 : null,
                total: items.length,
                totalPages,
                limit,
                currentPage: offset !== 0 ? page : 1,
                info: `Showing ${offset + 1} - ${limit * page} of ${items.length} pages`
            }
        }

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
                    url: artifact.url
                        .replace(/.pdf$/, `_${pageIndex + 1}.png`)
                        .replace(/.docx?$/, `_${pageIndex + 1}.png`),
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

        let pagination = url.searchParams.get('paginate')

        if (!pagination) {
            pagination = "item:1|item:2|item:3|item:4|item:5"
        }
        
        pagination = pagination?.split('|').map((query) => {
            const queryArray = query.split(',')
            const queryData = {
                item: {
                    index: Number(queryArray.filter((string) => string.includes('item'))[0]?.replace('item:', '') ?? 1) - 1,
                    page: Number(queryArray.filter((string) => string.includes('page')).at(0)?.replace('page:', '') ?? 1),
                    limit: Number(queryArray.filter((string) => string.includes('limit')).at(0)?.replace('limit:', '') ?? 10)
                }
            }
            return queryData
        })

        if (pagination) {
            for (let i = 0; i < pagination.length; i++) {
                if (formattedArtifacts[pagination[i].item.index] && formattedArtifacts[pagination[i].item.index].pages.length > 1) {
                    const paginationData = paginate(formattedArtifacts[pagination[i].item.index].pages, pagination[i].item.page, pagination[i].item.limit)

                    // Apply pagination
                    formattedArtifacts[pagination[i].item.index].pages = paginationData.pages
                    // Add pagination data
                    formattedArtifacts[pagination[i].item.index]['pagination'] = {
                        previousPage: paginationData.previousPage,
                        nextPage: paginationData.nextPage,
                        total: paginationData.total,
                        totalPages: paginationData.totalPages,
                        currentPage: paginationData.currentPage,
                        info: paginationData.info,
                    }
                }
            }
        }

        return {
            artifactCollection: {
                id: params.id
            },
            artifacts: formattedArtifacts,
        }
    } catch (errorMessage) {
        throw error(errorMessage.status ?? 400, errorMessage.body)
    }
}
