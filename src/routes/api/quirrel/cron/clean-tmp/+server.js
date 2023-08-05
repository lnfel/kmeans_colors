import { CronJob } from 'quirrel/sveltekit.js'
import { existsSync, statSync, rmSync } from 'node:fs'
import { readdir, stat, rm, appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { storage_path } from '$lib/config.js'
import { currentDateTime } from '$lib/aerial/hybrid/util.js'
import { STORAGE_PATH } from '$env/static/private'

/**
 * Clean storage/tmp folder every Wednesday at 4 PM
 * TODO: Move storage_path/tmp
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
                    // (await stat(`${storageTmpPath}/${filename}`)).isDirectory()
                    rm(`${storageTmpPath}/${filename}`, { recursive: true, force: true })
                }
            })
            appendFile(cronlogpath, `[${currentDateTime()}] Performed storage tmp cleaning.\n`)
        }
    }
)

export const POST = cron
