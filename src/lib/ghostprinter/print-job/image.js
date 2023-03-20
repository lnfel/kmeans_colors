import { mkdir, mkdtemp } from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'
import ShortUniqueId from "short-unique-id"

/**
 * Save base64 images to disk
 * 
 * @param {Array} base64Images Array of base64 ong images
 * @returns {Promise<String>} filedir path of saved images
 */
export const saveFromBase64 = async (base64Images) => {
    try {
        const filedir = `storage/tmp/${new ShortUniqueId()()}`
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