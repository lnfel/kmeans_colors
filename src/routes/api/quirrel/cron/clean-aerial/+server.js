import { CronJob } from 'quirrel/sveltekit.js'
import { existsSync } from 'node:fs'
import { readdir, rm, appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { storage_path } from '$lib/config.js'
import { airy, currentDateTime } from '$lib/aerial/hybrid/util.js'
import { STORAGE_PATH } from '$env/static/private'
import prisma from '$lib/prisma.js'

/**
 * Clean artifactCollections table every Wednesday at 4 PM
 * 
 * NOTE: This job will only affect rows that are created before this week's Monday 4 AM
 */
const cron = CronJob(
    'api/quirrel/cron/clean-aerial',
    ["0 16 * * 3", "Asia/Manila"],
    async () => {
        try {
            // Set date to this week's Monday at 4 AM
            const monday = new Date()
            monday.setDate(monday.getDate() - 2)
            monday.setHours(4, 0, 0, 0)

            const storageAerialPath = `${storage_path}/aerial`
            const cronlogpath = resolve(`${STORAGE_PATH}/log/cron.log`)

            const artifactCollections = await prisma.artifactCollection.findMany({
                select: {
                    id: true,
                },
                where: {
                    createdAt: {
                        lt: monday
                    }
                }
            })
    
            console.log(artifactCollections)
    
            // Turn artifact collections into transactions hence, we are not using await
            const transactions = artifactCollections.map((artifactCollection) => {
                return prisma.artifactCollection.delete({
                    where: {
                        id: artifactCollection.id
                    }
                })
            })
    
            const transaction = await prisma.$transaction(transactions)

            if (transaction.every((item) => item.processed) && existsSync(storageAerialPath)) {
                artifactCollections.forEach((artifactCollection) => {
                    rm(`${storageAerialPath}/${artifactCollection.id}`, { recursive: true, force: true })
                })
            }

            appendFile(cronlogpath, `[${currentDateTime()}] Performed cleaning of ${artifactCollections.length} ArtifactCollection(s) and aerial folder before ${monday}.\n`)
        } catch (error) {
            airy({ topic: 'prisma', message: error, label: 'Quirrel clean-aerial:' })
        }
    }
)

export const POST = cron
