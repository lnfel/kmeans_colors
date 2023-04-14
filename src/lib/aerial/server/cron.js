import cron from 'node-cron'
import { rm, readdir, appendFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { storage_path } from '$lib/config.js'

/**
 * Returns current datetime
 * 
 * @returns {String} Asia/Manila datetime in string format
 */
function currentDateTime() {
    return new Date()
        .toLocaleString('en-PH', {timezone: 'Asia/Manila', hour12: true, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})
        .toUpperCase()
        .replaceAll(/(,)|([.])/g, '')
        .replaceAll(/\s+/g, ' ') // replace invisible unicode character U+202f
        .replaceAll(/\//g, '-')
}

/**
 * Clean storage tmp folder every Monday at 16:00 PM (04:00 PM)
 * 
 * https://crontab.guru/#0_16_*_*_1
 * 0 16 * * 1
 * 
 * List of valid timezones
 * https://github.com/node-cron/node-cron/issues/124
 * 
 * OLD LIST
 * https://raw.githubusercontent.com/node-cron/tz-offset/master/generated/offsets.json
 * 'Asia/Manila': -480
 * 
 * NEW LIST
 * https://raw.githubusercontent.com/node-cron/tz-offset/a67968ab5b0efa6dee296dac32d3205b41f158e0/generated/offsets.json
 * Seems Asia/Manila is not changed...
 * 
 * https://reflectoring.io/schedule-cron-job-in-node/
 */
export const cleanStorage = cron.schedule('0 16 * * 1', async () => {
    const storagetmp_path = path.resolve(`${storage_path}/tmp`)
    const cronlog_path = path.resolve('storage/log/cron.log')
    const files = await readdir(storagetmp_path)
    const datetime_now = currentDateTime()

    try {
        for (const file of files) {
            const filepath = path.resolve(`${storagetmp_path}/${file}`)
            if (file !== '.gitignore') {
                await rm(filepath, {
                    recursive: true
                })
            }
        }

        await appendFile(cronlog_path, `[${datetime_now}] Performed storage cleaning.\n`)
        // await appendFile(cronlog_path, `storagetmp_path: ${storagetmp_path}\n`)
        // await appendFile(cronlog_path, `cronlog_path: ${cronlog_path}\n`)
        // await appendFile(cronlog_path, `storage_path: ${storage_path}\n`)
        await appendFile(cronlog_path, `Removed files and folders: ${files.join(', ')}\n`)
    } catch (error) {
        await appendFile(cronlog_path, `[${datetime_now}] cleanStorage ${error}\n`)
    }
}, {
    timezone: 'Asia/Manila',
    runOnInit: false,
})

/**
 * Clean storage log/app.log and log/error.log every Tuesday at 16:00 PM (04:00 PM)
 */
export const cleanLogs = cron.schedule('0 16 * * 2', async () => {
    const applog_path = path.resolve('storage/log/app.log')
    const errorlog_path = path.resolve('storage/log/error.log')
    const cronlog_path = path.resolve('storage/log/cron.log')
    const datetime_now = currentDateTime()

    try {
        await writeFile(applog_path, '')
        await writeFile(errorlog_path, '')

        await appendFile(cronlog_path, `[${datetime_now}] Performed logs cleaning.\n`)
        // await appendFile(cronlog_path, `applog_path: ${applog_path}\n`)
        // await appendFile(cronlog_path, `errorlog_path: ${errorlog_path}\n`)
    } catch (error) {
        await appendFile(cronlog_path, `[${datetime_now}] cleanLogs ${error}\n`)
    }
}, {
    timezone: 'Asia/Manila',
    runOnInit: false,
})

/**
 * Clean storage/log/cron.log every Wednesday at 16:00 PM (04:00 PM)
 */
export const cleanCronLogs = cron.schedule('0 16 * * 3', async () => {
    const cronlog_path = path.resolve('storage/log/cron.log')
    const datetime_now = currentDateTime()

    try {
        await writeFile(cronlog_path, '')

        await appendFile(cronlog_path, `[${datetime_now}] Performed cron logs cleaning.\n`)
    } catch (error) {
        await appendFile(cronlog_path, `[${datetime_now}] cleanLogs ${error}\n`)
    }
}, {
    timezone: 'Asia/Manila',
    runOnInit: false,
})
