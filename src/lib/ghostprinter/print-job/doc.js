import { mkdir, mkdtemp } from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'
import ShortUniqueId from "short-unique-id"
import { storage_path } from "$lib/config.js"

/**
 * Save base64 doc to disk
 * 
 * @param {String} base64 base64 document
 * @returns {Promise<String>} filepath saved document
 */
export const saveDocFromBase64 = async (base64) => {
    try {
        const name = new ShortUniqueId()()
        const filepath = `${storage_path}/tmp/${name}.docx`
        
        const buffer = Buffer.from(base64.replace('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,', ''), 'base64')
        await writeFile(filepath, buffer, { flag: 'w+' })

        return {
            name,
            filepath
        }
    } catch (error) {
        console.log(error)
    }
}

export default {
    saveDocFromBase64,
}
