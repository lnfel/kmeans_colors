import { CronJob } from 'quirrel/sveltekit.js'
import { rm, readdir, appendFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { storage_path } from '$lib/config.js'

/**
 * Clean logs every Monday at 4 PM
 */
const cron = CronJob(
    'api/quirrel/cron/clean-logs',
    ["0 16 * * 1", "Asia/Manila"],
    async (job) => {
        const cronlogpath = path.resolve('storage/log/cron.log')
        const currentDateTime = new Date()
            .toLocaleString('en-PH', {timezone: 'Asia/Manila', hour12: true, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})
            .toUpperCase()
            .replaceAll(/(,)|([.])/g, '')
            .replaceAll(/\s+/g, ' ') // replace invisible unicode character U+202f
            .replaceAll(/\//g, '-')

        try {
            // Do something here
            appendFile(cronlogpath, `[${currentDateTime}] Performed storage cleaning.\n`)
            appendFile(cronlogpath, `storage_path: ${storage_path}\n`)
            appendFile(cronlogpath, `cronlogpath: ${cronlogpath}\n`)
        } catch (error) {
            appendFile(cronlogpath, `[${currentDateTime}] ${error}\n`)
        }
    }
)

export const POST = cron
