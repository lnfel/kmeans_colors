import { connect } from 'amqplib'
import chalk from 'chalk'
// import { RABBITMQ_CONNECTION_URL } from '$env/static/private'

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
 * @param {String|import('amqplib').Options.Connect} connection
 * @returns {Promise<import('amqplib').Connection>} Rabbitmq connection
 */
export const rabbitConnect = async (connection) => {
    return await connect(connection)
}

/**
 * 
 * https://stackoverflow.com/a/23756210/12478479
 * @param {String|import('amqplib').Options.Connect|'amqp://127.0.0.1'} connection
 * @returns {void}
 */
export const rabbitCreateGlobalConnection = async (connection = 'amqp://127.0.0.1') => {
    if (!globalThis[GlobalRabbitConnection]) {
        console.log(`${chalk.redBright('[rabbitmq]')} ${chalk.yellowBright('Connecting to Rabbitmq server.')}`)

        const rabbitConnection = await rabbitConnect(connection)
        globalThis[GlobalRabbitConnection] = rabbitConnection

        const matchedHost = typeof connection === 'string'
            ? connection.match(/amqp:\/\/127\.0\.0\.1|(?=[^@]*$).*?(?=:)/si)
            : connection?.hostname

        console.log(`${chalk.redBright('[rabbitmq]')} ${chalk.green(`Connected to Rabbitmq server (${matchedHost})`)}`)
    }
}