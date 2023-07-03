import { google } from 'googleapis'

/**
 * Sample google server side api call
 * https://github.com/HalfdanJ/svelte-google-auth/blob/main/src/routes/server-api-call/%2Bpage.server.ts
 * https://developers.google.com/drive/api/v3/reference/files/list
 * use the trashed=false query parameter to filter trashed files from the results.
 * 
 * @param {import('googleapis').Auth.OAuth2Client} auth
 * @returns {Promise<import('googleapis').drive_v3.Schema$File[]>} Drive files
 */
export async function listDriveFiles(auth) {
    try {
        const drive = google.drive({ version: 'v3', auth })
        const response = await drive.files.list({
            'pageSize': 10,
            'fields': 'files(id, name)',
            'q': 'trashed=false'
        })
        return response.data.files
    } catch (error) {
        console.log(error)
        throw error
    }
}

/**
 * 
 * https://developers.google.com/drive/api/v3/reference/about/get
 * 
 * @param {import('googleapis').Auth.OAuth2Client} auth
 * @returns {Promise<Object>}
 */
export async function listStorageQuota(auth) {
    try {
        const drive = google.drive({ version: 'v3', auth })
        const response = await drive.about.get({
            fields: 'storageQuota'
        })
        // return response.data.storageQuota
        const formattedStorageQuota = Object.fromEntries(Object.entries(response.data.storageQuota).map(([key, value]) => [key, formatBytes(value)]))
        formattedStorageQuota['occupiedSpace'] = occupiedStorageSpaceToPercentile(response.data.storageQuota.limit, response.data.storageQuota.usageInDrive)

        return formattedStorageQuota
    } catch (error) {
        console.log(error)
        throw error
    }
}

/**
 * Convert bytes to KB, MB, GB
 * 
 * https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
 * 
 * @param {String|Number} bytes Bytes to convert
 * @param {Number} decimals Number of decimal places to show
 * @returns {String} Converted bytes string accompanied with proper unit of measurement
 */
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Convert occupied disk space to percentage, rounded up
 * 
 * https://calculator.academy/free-disk-space-percentage-calculator/#:~:text=Free%20Disk%20Space%20Percentage%20Formula&text=To%20calculate%20the%20free%20disk,and%20then%20multiply%20by%20100.
 * 
 * @param {Number} totalSpace 
 * @param {Number} occupiedSpace 
 * @returns {Number}
 */
function occupiedStorageSpaceToPercentile(totalSpace, occupiedSpace) {
    // 100 - remaining disk space
    return 100 - Math.ceil((totalSpace - occupiedSpace) / totalSpace * 100)
}

/**
 * List files in Aerial folder and sum the total size of files
 * 
 * https://stackoverflow.com/questions/24720075/how-to-get-list-of-files-by-folder-on-google-drive-api
 * 
 * @param {Auth.OAuth2Client} auth 
 * @returns {Promise<Object>}
 */
export async function listAerialFolderDetails(auth) {
    const drive = google.drive({ version: 'v3', auth })
    const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id,name)',
    })

    if (response.data.files.find((folder) => folder.name === 'Aerial')) {
        const aerial = await drive.files.list({
            q: `'${response.data.files.find((folder) => folder.name === 'Aerial').id}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
            fields: 'files(id,name,size)',
        })

        aerial.data.files = aerial.data.files.map((file) => {
            file['humanReadableSize'] = formatBytes(file.size)
            return file
        })
        aerial.data['totalSizeInBytes'] = aerial.data.files.reduce((accumulator, file, index) => {
            return accumulator + parseInt(file.size)
        }, 0)
        aerial.data['totalSize'] = formatBytes(aerial.data['totalSizeInBytes'])
        aerial.data.id = response.data.files.find((folder) => folder.name === 'Aerial')?.id ?? ''

        return aerial.data
    }

    return null
}

export default {
    listDriveFiles,
    listStorageQuota,
    listAerialFolderDetails
}
