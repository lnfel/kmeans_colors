import { fileCheck } from '$lib/aerial/hybrid/validation.js'

/**
 * Get file extension based on mimetype
 * 
 * Prepend to a string
 * https://stackoverflow.com/a/6094172/12478479
 * 
 * @param {String} mimetype 
 * @returns {String} File extension
 */
export const getFileExtension = (mimetype) => {
    let extension

    if (fileCheck.isImage(mimetype)) {
        extension = mimetype.replace('image/', '').replace('+xml', '').replace(/^/, '.')
    }

    if (fileCheck.isPdf(mimetype)) {
        extension = mimetype.replace('application/', '').replace(/^/, '.')
    }

    if (fileCheck.isDoc(mimetype)) {
        extension = mimetype
            .replace('application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx')
            .replace('application/msword', '.doc')
    }

    return extension
}