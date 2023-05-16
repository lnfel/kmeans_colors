/**
 * Aerial supported file types
 */
export const allowedFileTypes = {
    images: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif', 'image/tiff'],
    pdf: ['application/pdf'],
    doc: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
}

/**
 * Simple file checking based on supported file types
 */
export const fileCheck = {
    isImage: (type) => {
        return allowedFileTypes.images.includes(type)
    },
    isPdf: (type) => {
        return allowedFileTypes.pdf.includes(type)
    },
    isDoc: (type) => {
        return allowedFileTypes.doc.includes(type)
    }
}

/**
 * Check if File is empty
 * 
 * By default file input returns an empty File with the following attributes
 * when form is submitted:
 * - name: undefined
 * - size: 0
 * - type: 'application/octet-stream'
 * 
 * @param {File} file 
 * @returns {Boolean} Whether File is empty
 */
export const emptyFile = (file) => {
    return file.name === 'undefined' && file.size === 0 && file.type === 'application/octet-stream'
}

export default {
    allowedFileTypes,
    fileCheck,
    emptyFile
}
