import { CronJob } from 'quirrel/sveltekit.js'
import { rm, readdir, appendFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { currentDateTime } from '$lib/aerial/hybrid/util.js'
import { STORAGE_PATH } from '$env/static/private'

/**
 * Clean logs every Monday at 4 PM
 */
const cron = CronJob(
    'api/quirrel/cron/clean-logs',
    ["0 16 * * 1", "Asia/Manila"],
    async () => {
        const cronlogpath = path.resolve(`${STORAGE_PATH}/log/cron.log`)

        try {
            // Do something here
            appendFile(cronlogpath, `[${currentDateTime()}] Performed storage cleaning.\n`)
        } catch (error) {
            appendFile(cronlogpath, `[${currentDateTime()}] ${error}\n`)
        }
    }
)

export const POST = cron
