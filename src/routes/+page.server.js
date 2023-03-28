import { writeFile } from 'node:fs/promises'
import { storage_path } from "$lib/config.js"
import { kmeansColors } from "$lib/ghostprinter/print-job/pdf.js"
import { summary } from '$lib/ghostprinter/print-job/cmyk.js'

export const load = async ({ locals }) => {
    return { }
}

export const actions = {
    /**
     * Save file to disk using node async writeFile
     * https://stackoverflow.com/questions/40137880/save-video-blob-to-filesystem-electron-node-js
     * 
     * Node Filesystem flags
     * https://nodejs.org/dist/latest-v18.x/docs/api/fs.html#file-system-flags
     */
    default: async ({ request, locals, cookies }) => {
        const formData = await request.formData()
        const files = formData.getAll('file')
        const filenames = formData.getAll('filenames')

        console.log('server files: ', files)
        console.log('server filenames: ', filenames)

        let kmeans_colors = []

        for (let i = 0; i < files.length; i++) {
            const buffer = Buffer.from(await files[i].arrayBuffer())
            const extension = files[i].type.replace('image/', '')
            const imagepath = `${storage_path}/tmp/file-${i}.${extension}`
            await writeFile(imagepath, buffer, { flag: 'w+' })
            const color = await kmeansColors(imagepath)
            kmeans_colors = [...kmeans_colors, color]
        }

        const cmyk = await summary(kmeans_colors)
        console.log('cmyk: ', cmyk)

        return {
            kmeans_colors,
            cmyk
        }
    }
}