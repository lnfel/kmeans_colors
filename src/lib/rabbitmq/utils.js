import { connect } from 'amqplib'
import chalk from 'chalk'

/**
 * Global Rabbitmq Server symbol
 * 
 * @type {Symbol}
 * @global
 */
export const GlobalRabbitConnection = Symbol.for('sveltekit.rabbitmq.connection')
export const GlobalRabbitChannel = Symbol.for('sveltekit.rabbitmq.channel')

/**
 * Connect to Rabbitmq server
 * 
 * NOTE: localhost sometimes resolve to ::1 IPV6 address so we need explicitly use 127.0.0.1
 * 
 * @returns {Promise<import('amqplib').Connection>} Rabbitmq connection
 */
export const rabbitConnect = async () => {
    return await connect('amqp://127.0.0.1')
}

export const rabbitCreateGlobalConnection = async () => {
    if (!globalThis[GlobalRabbitConnection]) {
        console.log(`${chalk.redBright('[rabbitmq]')} ${chalk.yellowBright('Connecting to Rabbitmq server.')}`)

        const rabbitConnection = await rabbitConnect()
        globalThis[GlobalRabbitConnection] = rabbitConnection

        console.log(`${chalk.redBright('[rabbitmq]')} ${chalk.green('Connected to Rabbitmq server.')}`)
    }
}