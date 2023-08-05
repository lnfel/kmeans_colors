import { CronJob } from 'quirrel/sveltekit.js'
import { existsSync } from 'node:fs'
import { readdir, rm, appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { storage_path } from '$lib/config.js'
import { airy, currentDateTime } from '$lib/aerial/hybrid/util.js'
import { STORAGE_PATH } from '$env/static/private'

/**
 * Clean storage/tmp folder every Wednesday at 4 PM
 */
const cron = CronJob(
    'api/quirrel/cron/clean-tmp',
    ["0 16 * * 3", "Asia/Manila"],
    async () => {
        // const storageTmpPath = resolve(`${STORAGE_PATH}/tmp`)
        const storageTmpPath = `${storage_path}/tmp`
        const cronlogpath = resolve(`${STORAGE_PATH}/log/cron.log`)
        if (existsSync(storageTmpPath)) {
            const files = await readdir(storageTmpPath)
            files.forEach(async (filename) => {
                if (filename !== '.gitignore') {
                    rm(`${storageTmpPath}/${filename}`, { recursive: true, force: true })
                }
            })
            appendFile(cronlogpath, `[${currentDateTime()}] Performed storage tmp cleaning.\n`)
        }
    }
)

export const POST = cron
