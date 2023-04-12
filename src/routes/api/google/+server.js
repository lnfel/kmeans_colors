import { json } from '@sveltejs/kit'
import { getOAuth2Client, isSignedIn } from 'svelte-google-auth'
import { google } from 'googleapis'

/**
 * https://developers.google.com/drive/api/guides/manage-uploads
 * https://developers.google.com/drive/api/guides/mime-types
 * https://googleapis.dev/nodejs/googleapis/latest/drive/classes/Resource$Files.html#export
 * https://gist.github.com/tanaikech/ae451679e8220f3b2d48edb3f8c1a8d3
 * https://www.mikesallese.me/blog/google-drive-resumable-upload/
 * https://stackoverflow.com/questions/71375468/return-file-id-after-resumable-upload-finished-with-google-drive
 * https://stackoverflow.com/questions/73259716/how-to-solve-failed-to-parse-content-range-header-in-google-drive-api-for-perf
 * https://stackoverflow.com/questions/75569067/google-api-driveactivity-query-gives-insufficient-scope-error
 * https://stackoverflow.com/questions/60027518/how-to-correctly-read-pdf-into-nodejs-buffer-from-google-drive-apis-export-meth
 */
export const POST = async ({ request, locals, cookies, fetch }) => {
    const file = await request.json()
    console.log('file name: ', file.name)
    console.log('file type: ', file.type)
    console.log('file size: ', file.size)
    const base64 = file.url

    if (isSignedIn(locals)) {
        console.log('isSignedIn: ', isSignedIn(locals))
        const split = 262144 // This is a sample chunk size. https://stackoverflow.com/a/73264129/12478479
        const doc = Buffer.from(base64.replace('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,', ''), 'base64')
        // console.log('doc: ', doc)
        const docSize = doc.length
        // console.log('docSize: ', docSize)
        const array = [...new Int8Array(doc)]
        // console.log('array: ', array)
        const chunks = [...Array(Math.ceil(array.length / split))].map((_) => Buffer.from(new Int8Array(array.splice(0, split))))
        // console.log('chunks: ', chunks)

        const client = getOAuth2Client(locals)
        console.log('client: ', client)

        try {
            // Perform resumable upload, initial request
            const resumable = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${client.credentials.access_token}`,
                    "X-Upload-Content-Type": file.type,
                    "X-Upload-Content-Length": file.size,
                    "Content-Type": "application/json; charset=UTF-8"
                },
                body: JSON.stringify({
                    name: file.name,
                    // mimeType: file.type
                    // explicitly assign google workspace document mimeType so we can perform
                    // export operations with conversions
                    mimeType: 'application/vnd.google-apps.document'
                })
            })

            // console.log('resumable headers: ', resumable.headers)
            console.log('resumable headers location: ', resumable.headers.get('location'))

            // Perform resumable upload, second part
            let start = 0
            let upload
            for (let i = 0; i < chunks.length; i++) {
                const end = start + chunks[i].length - 1
                upload = await fetch(resumable.headers.get('location'), {
                    method: 'PUT',
                    headers: {
                        "Content-Range": `bytes ${start}-${end}/${docSize}`
                    },
                    body: chunks[i]
                })
                start = end + 1
                if (upload?.data) {
                    console.log(upload.data)
                }
            }
            const uploadData = await upload.json()
            console.log('uploadData: ', uploadData)

            // Export docx to pdf
            const drive = google.drive({version: 'v3', auth: client})
            const exportResponse = await drive.files.export({
                fileId: uploadData.id,
                mimeType: 'application/pdf',
            }, {
                responseType: 'arraybuffer'
            })
            console.log('exportResponse body: ', exportResponse.data)
            const base64PDF = exportResponse.status === 200
                ? `data:application/pdf;base64,${Buffer.from(exportResponse.data).toString('base64')}`
                : ''

            return json({
                base64PDF
            })
        } catch (error) {
            console.log('Error encountered while processing upload to google drive.')
            console.log(error)
        }
    }

    return json({
        message: 'Please sign in using google oauth first.'
    })
}