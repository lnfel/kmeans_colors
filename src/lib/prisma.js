import Client, { PrismaClient } from '@prisma/client'
import ShortUniqueId from "short-unique-id"

const prisma = new PrismaClient()

const prefixMap = {
    ArtifactCollection: 'artc_',
    Artifact: 'art_',
    KmeansColors: 'kc_',
    // Color: 'c_',
    CMYK: 'cmyk_',
    // CMYKSummary: 'cmyks_',
}

export const mimetypeMapFromEnum = {
    IMAGE_PNG: 'image/png',
    IMAGE_JPEG: 'image/jpeg',
    IMAGE_JPG: 'image/jpg',
    IMAGE_WEBP: 'image/webp',
    IMAGE_SVG: 'image/svg+xml',
    IMAGE_GIF: 'image/gif',
    IMAGE_TIFF: 'image/tiff',
    APPLICATION_PDF: 'application/pdf',
    APPLICATION_DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    APPLICATION_MSWORD: 'application/msword',
}

export const mimetypeMapToEnum = {
    'image/png': 'IMAGE_PNG',
    'image/jpeg': 'IMAGE_JPEG',
    'image/jpg': 'IMAGE_JPG',
    'image/webp': 'IMAGE_WEBP',
    'image/svg+xml': 'IMAGE_SVG',
    'image/gif': 'IMAGE_GIF',
    'image/tiff': 'IMAGE_TIFF',
    'application/pdf': 'APPLICATION_PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'APPLICATION_DOCX',
    'application/msword': 'APPLICATION_MSWORD',
}

/**
 * Generate ShortUniqueId when creating models
 * 
 * Generate custom id using prisma middleware
 * https://github.com/prisma/prisma/issues/6719#issuecomment-1178211695
 * 
 * @type {Client.Prisma.Middleware}
 * @param {Client.Prisma.MiddlewareParams} params 
 * @param {any} next 
 * @returns {Promise<any>} Promise<any>
 */
export const generateShortUniqueId = async (params, next) => {
    console.log('generateShortUniqueId middleware params: ', params)
    
    if (params.action === 'create') {
        let prefix = prefixMap[params.model] ?? ''
        /**
         * stamp requires to have final length of 11 characters which
         * is kinda too much in aerial's use case
         */
        // params.args.data.id = `${prefix}${new ShortUniqueId().stamp(11)}`
        params.args.data.id = `${prefix}${new ShortUniqueId()()}`
    }

    return await next(params)
}

prisma.$use(generateShortUniqueId)

export default prisma
