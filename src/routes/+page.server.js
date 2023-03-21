import { writeFile } from 'node:fs/promises'
import KmeansColors, { defaultFlags, hexToRgb, hexToCmyk } from '$lib/execa/kmeans-colors'
import { storage_path } from "$lib/config.js"

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

        // const {
        //     file
        // } = Object.fromEntries(formData)
        const files = formData.getAll('file')
        const filenames = formData.getAll('filenames')

        console.log('server files: ', files)
        console.log('server filenames: ', filenames)

        console.log('KmeansColors: ', KmeansColors)

        let kmeans_colors = []

        for (let i = 0; i < files.length; i++) {
            // Save file to disk
            const buffer = Buffer.from(await files[i].arrayBuffer())
            const extension = files[i].type.replace('image/', '')
            const filepath = `${storage_path}/tmp/file-${i}.${extension}`
            await writeFile(filepath, buffer, { flag: 'w+' })

            // Compute dominant colors on the saved image
            const flags = defaultFlags(filepath)
            const {stdout} = await KmeansColors.exec(flags)
            console.log(stdout)

            let kmeans = stdout.split('\n')
            let colors = kmeans[0].split(',')
            let percentage = kmeans[1].split(',')
            let color = colors.map((color, index) => {
                const hexstring = `#${color}`

                return {
                    color: hexstring,
                    hex: hexstring,
                    rgb: hexToRgb(hexstring).join(' '),
                    cmyk: hexToCmyk(hexstring),
                    percentage: (percentage[index] * 100).toFixed(2)
                }
            })
            
            kmeans_colors = [...kmeans_colors, color]
        }

        return {
            kmeans_colors
        }
    }
}