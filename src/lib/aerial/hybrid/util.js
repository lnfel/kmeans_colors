import { fileCheck } from '$lib/aerial/hybrid/validation.js'
import chalk from 'chalk'

/**
 * Get file extension based on mimetype
 * 
 * Prepend to a string
 * https://stackoverflow.com/a/6094172/12478479
 * 
 * @param {String} mimetype 
 * @returns {String} File extension
 */
export const getFileExtension = (mimetype) => {
    let extension

    if (fileCheck.isImage(mimetype)) {
        extension = mimetype.replace('image/', '').replace('+xml', '').replace(/^/, '.')
    }

    if (fileCheck.isPdf(mimetype)) {
        extension = mimetype.replace('application/', '').replace(/^/, '.')
    }

    if (fileCheck.isDoc(mimetype)) {
        extension = mimetype
            .replace('application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx')
            .replace('application/msword', '.doc')
    }

    return extension
}

/**
 * @typedef {'default'|'wss'|'rabbitmq'|'quirrel'|'prisma'|'hooks'} AiryTopic
 */

/**
 * @typedef AiryTopicEnum
 * @property {AiryTopic} default
 * @property {AiryTopic} wss
 * @property {AiryTopic} rabbitmq
 * @property {AiryTopic} prisma
 * @property {AiryTopic} hooks
 */

/**
 * @typedef {AiryTopicEnum}
 */
const airyTopic = {
    default: chalk.white,
    wss: chalk.blueBright('[wss]'),
    rabbitmq: chalk.hex('#ff6701')('[rabbitmq]'),
    quirrel: chalk.hex('#bb5e11')('[quirrel]'),
    prisma: chalk.hex('#8b8ee3')('[prisma]'),
    hooks: chalk.hex('#f96743')('[kit:hooks]')
}

/**
 * @typedef {'default'|'success'|'executing'|'error'} AiryAction
 */

/**
 * @typedef AiryActionEnum
 * @property {AiryAction} default
 * @property {AiryAction} success
 * @property {AiryAction} executing
 * @property {AiryAction} error
 */

/**
 * @typedef {AiryActionEnum}
 */
const airyAction = {
    default: chalk.whiteBright,
    success: chalk.green,
    executing: chalk.yellowBright,
    error: chalk.redBright
}

/**
 * AiryParams
 * 
 * @typedef {Object} AiryParams
 * @property {'default'|'wss'|'rabbitmq'|'quirrel'|'prisma'|'hooks'} topic - Any particular topic related to the log output
 * @property {String|any} message - Message to be logged
 * @property {String} label - Label for this log
 * @property {'default'|'success'|'executing'|'error'} action - Type of action taken
 */

/**
 * Airy - just a cute logger
 * 
 * Using inspect limits airy for server use only
 * https://nodejs.org/api/util.html#utilinspectobject-showhidden-depth-colors
 * 
 * With dynamic imports we can now load inspect on demand when checking for browser environment
 * 
 * @param {AiryParams} AiryParams
 */
export const airy = async ({ topic, message = '', label = '', action = 'default' }) => {
    if (label) {
        label = `${label} `
    }

    if (typeof window === "undefined") {
        // Use util.inspect if message is an object
        if (typeof message === 'object' && message !== null) {
            const { inspect } = (await import('node:util')).default
            message = inspect(message, { colors: true, showHidden: true, depth: 5 })
        }

        if (topic) {
            console.log(`${airyTopic[topic]} ${label}${airyAction[action](message)}`)
        } else {
            console.log(`${label}${airyAction[action](message)}`)
        }
    } else {
        if (topic) {
            console.log(topic + ' ' + label, message)
        } else {
            console.log(label, message)
        }
    }
}

/**
 * Current date and time with post meridiem
 * 
 * @returns {String} Datetime in `MM-DD-YYYY HH:mm Ante` 12 hour format
 */
export const currentDateTime = () => {
    return new Date()
        .toLocaleString('en-PH', {timezone: 'Asia/Manila', hour12: true, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})
        .toUpperCase()
        .replaceAll(/(,)|([.])/g, '')
        .replaceAll(/\s+/g, ' ') // replace invisible unicode character U+202f
        .replaceAll(/\//g, '-')
}
