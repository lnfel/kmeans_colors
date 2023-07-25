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
 * @typedef {'default'|'wss'|'rabbitmq'|'quirrel'} AiryTopic
 */

/**
 * @typedef AiryTopicEnum
 * @property {AiryTopic} default
 * @property {AiryTopic} wss
 * @property {AiryTopic} rabbitmq
 */

/**
 * @typedef {AiryTopicEnum}
 */
const airyTopic = {
    default: chalk.white,
    wss: chalk.blueBright('[wss]'),
    rabbitmq: chalk.hex('#ff6701')('[rabbitmq]'),
    quirrel: chalk.hex('#bb5e11')('[quirrel]'),
    prisma: chalk.hex('')
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
 * @property {'default'|'wss'|'rabbitmq'|'quirrel'} topic - Any particular topic related to the log output
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
