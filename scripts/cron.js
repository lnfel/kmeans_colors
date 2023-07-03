import cron from 'node-cron'
import { rm, readdir, appendFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Experimental cron job task
 * 
 * run using PM2:
 * pm2 start ecosystem.config.cjs --only aerial_cron_jobs
 * 
 * stop:
 * pm2 stop aerial_cron_jobs
 * 
 * run using node:
 * node ./scripts/cron.js
 */

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
const cleanStorage = cron.schedule('* * * * *', async () => {
    // When running this script with pm2 we won't see any console log
    // console.log('Running cleanStorage')
    const cronlogpath = path.resolve('storage/log/cron.log')
    const files = await readdir('storage/tmp')
    const currentDateTime = new Date()
        .toLocaleString('en-PH', {timezone: 'Asia/Manila', hour12: true, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})
        .toUpperCase()
        .replaceAll(/(,)|([.])/g, '')
        .replaceAll(/\s+/g, ' ') // replace invisible unicode character U+202f
        .replaceAll(/\//g, '-')
    try {
        for (const file of files) {
            const filepath = path.resolve(`storage/tmp/${file}`)
            if (file !== '.gitignore') {
                await rm(filepath, {
                    recursive: true
                })
            }
        }
        appendFile(cronlogpath, `[${currentDateTime}] Performed storage cleaning.\n`)
    } catch (error) {
        appendFile(cronlogpath, `[${currentDateTime}] ${error}\n`)
    }
}, {
    timezone: 'Asia/Manila',
    runOnInit: false,
})

cleanStorage.start()
