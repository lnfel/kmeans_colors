import { writeFile } from 'node:fs/promises'
import { storage_path } from "$lib/config.js"
import { kmeansColors } from "$lib/ghostprinter/print-job/pdf.js"
import { summary } from '$lib/ghostprinter/print-job/cmyk.js'
import { getOAuth2Client, isSignedIn } from 'svelte-google-auth'
import { google } from 'googleapis'

/**
 * Sample google server side api call
 * https://github.com/HalfdanJ/svelte-google-auth/blob/main/src/routes/server-api-call/%2Bpage.server.ts
 * https://developers.google.com/drive/api/v3/reference/files/list
 * use the trashed=false query parameter to filter trashed files from the results.
 * 
 * @param {import('google-auth-library').OAuth2Client} auth OAuth2Client
 */
async function listDriveFiles(auth) {
    try {
        const drive = google.drive({ version: 'v3', auth })
        const response = await drive.files.list({
            'pageSize': 10,
            'fields': 'files(id, name)',
            'q': 'trashed=false'
        })
        return response.data.files
    } catch (error) {
        throw error
    }
}

export const load = async ({ locals }) => {
    if (isSignedIn(locals)) {
        const client = getOAuth2Client(locals)
        // console.log('client: ', client)
        const driveFiles = await listDriveFiles(client)
        return {
            driveFiles
        }
    }
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