import { mkdir, mkdtemp } from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'
import ShortUniqueId from "short-unique-id"
import { storage_path } from "$lib/config.js"

/**
 * Save base64 images to disk
 * 
 * @param {Array} base64Images Array of base64 images
 * @param {String} name Optional name otherwise the filedir will be generated using new ShortUniqueId
 * @returns {Promise<String>} filedir path of saved images
 */
export const saveFromBase64 = async (base64Images, name) => {
    try {
        const filedir = `${storage_path}/tmp/${name ?? new ShortUniqueId()()}`
        await mkdir(filedir, { recursive: true })
        
        base64Images.forEach(async (image, index) => {
            const buffer = Buffer.from(image.replace('data:image/png;base64,', ''), 'base64')
            await writeFile(`${filedir}/page-${index}.png`, buffer, { flag: 'w+' })
        })

        return filedir
    } catch (error) {
        console.log(error)
    }
}

export default {
    saveFromBase64,
}