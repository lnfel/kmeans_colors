import { google } from 'googleapis'

/**
 * Sample google server side api call
 * https://github.com/HalfdanJ/svelte-google-auth/blob/main/src/routes/server-api-call/%2Bpage.server.ts
 * https://developers.google.com/drive/api/v3/reference/files/list
 * use the trashed=false query parameter to filter trashed files from the results.
 * 
 * @param {import('googleapis').Auth.OAuth2Client} auth - Google OAuth2Client with credentials set
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
 * @param {Boolean} base10 Default unit of measure is KiB which is equivalent to 1024 bytes. Enable if you want to measure in 1 kB per 1000 bytes
 * @returns {String} Converted bytes string accompanied with proper unit of measurement
 */
function formatBytes(bytes, decimals = 2, base10 = false) {
    if (!+bytes) return '0 bytes'
    const k = base10 ? 1000 : 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = base10 ? ['Bytes', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
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
 * @returns {Promise<import('googleapis').drive_v3.Schema$FileList & { totalSizeInBytes: Number, totalSize: String }>} Drive FileList
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

/**
 * Look for Aerial folder in current user's google drive
 * 
 * https://github.com/googleapis/google-api-nodejs-client/issues/2208#issuecomment-671676734
 * 
 * @param {import('googleapis').Auth.OAuth2Client} client OAuth2Client
 * @returns {Promise<import('googleapis').drive_v3.Schema$File|undefined>} Returns drive file object when found and undefined when not found
 */
export async function searchAerialFolder(client) {
    const drive = google.drive({version: 'v3', auth: client})
    const listResponse = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id,name)',
    })

    return listResponse.data.files.find((folder) => folder.name === 'Aerial')
}

/**
 * Create Aerial folder in current user's google drive
 * 
 * @param {import('googleapis').Auth.OAuth2Client} client
 * @returns {Promise<import('googleapis').drive_v3.Schema$File>} Returns drive file object
 */
export async function aerialFolderCreate(client) {
    const drive = google.drive({version: 'v3', auth: client})
    const fileMetadata = {
        name: 'Aerial',
        mimeType: 'application/vnd.google-apps.folder',
    }

    const folderResponse = await drive.files.create({
        requestBody: fileMetadata,
        // fields: 'id,name,kind,mimeType',
        fields: 'id,name',
    })

    return folderResponse.data
}

/**
 * Initiate resumable upload by sending initial request with query parameter of uploadType=resumable
 * 
 * If the initiation request succeeds, the response includes a 200 OK HTTP status code. In addition, it includes a Location header that specifies the resumable session URI.
 * 
 * Save the resumable session URI so you can upload the file data and query the upload status. A resumable session URI expires after one week.
 * 
 * @param {[string, string][] | Record<string, string> | Headers} headers Request Headers
 * @param {ReadableStream | XMLHttpRequestBodyInit} body Request Body
 * @returns {Promise<Response>}
 */
export async function startResumableUpload(headers, body) {
    return await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers,
        body
    })
}

export default {
    listDriveFiles,
    listStorageQuota,
    listAerialFolderDetails,
    searchAerialFolder,
    aerialFolderCreate,
    startResumableUpload
}
