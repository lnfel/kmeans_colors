import { building } from '$app/environment'
import { airy } from '$lib/aerial/hybrid/util.js'
import { GlobalRabbitConnection, GlobalRabbitChannel } from '$lib/rabbitmq/utils.js'

/**
 * @type {import('amqplib').Channel | undefined} Rabbitmq channel or undefined
 */
export let rabbitChannel

let rabbitInitialized = false

/**
 * Create Rabbitmq channel
 * 
 * @param {import('amqplib').Connection} connection Rabbitmq connection
 * @returns {Promise<import('amqplib').Channel>} Rabbitmq channel
 */
export const rabbitCreateChannel = async (connection) => {
    return await connection.createChannel()
}

/**
 * Default Rabbitmq queue name for use by Aerial
 */
export const rabbitDefaultQueue = 'aerial:job-queue'

/**
 * Create a durable queue with a type of quorum
 * 
 * @type {import('amqplib').Options.AssertQueue}
 */
export const rabbitDefaultQueueOptions = {
    durable: true,
    arguments: {
        "x-queue-type": 'quorum'
    }
}

/**
 * Create Rabbitmq queue based on queue name and options provided
 * 
 * @param {import('amqplib').Channel} channel
 * @param {String} queue The name of queue to be used
 * @param {import('amqplib').Options.AssertQueue} options
 * @returns {Promise<undefined>} Promise void
 */
export const rabbitUseQueue = async (channel, queue, options) => {
    await channel.assertQueue(queue, options)
}

/**
 * Start Aerial Rabbitmq instance
 * 
 * @returns {undefined}
 */
export const rabbitStartAerialQueue = async () => {
    if (rabbitInitialized) return ;

    try {
        /**
         * @type {import('amqplib').Connection}
         */
        const rabbitConnection = globalThis[GlobalRabbitConnection]
        /**
         * @type {import('amqplib').Channel}
         */
        const rabbitChannel = globalThis[GlobalRabbitChannel]

        if (!rabbitChannel) {
            airy({ topic: 'rabbitmq', message: "Connecting to Rabbitmq channel.", action: 'executing' })

            globalThis[GlobalRabbitChannel] = await rabbitCreateChannel(rabbitConnection)
            await rabbitUseQueue(globalThis[GlobalRabbitChannel], rabbitDefaultQueue, rabbitDefaultQueueOptions)
            
            airy({ topic: 'rabbitmq', message: "Connected to Rabbitmq channel.", action: 'success' })
        }

        rabbitInitialized = true
    } catch (error) {
        airy({ topic: 'rabbitmq', message: error.message, action: 'error' })
    }
}

/**
 * Rabbitmq startup sveltekit handle hook
 * 
 * @type {import('@sveltejs/kit').Handle}
 * @returns {import('@sveltejs/kit').MaybePromise}
 */
export const svelteHandleRabbitmqStartup = async ({ event, resolve }) => {
    rabbitStartAerialQueue()

    // Skip WebSocket server when pre-rendering pages
    if (!building) {
        if (globalThis[GlobalRabbitChannel] !== undefined) {
            /**
             * Unfortunately we cannot pass this to quirrel due to
             * TypeError: Converting circular structure to JSON
             */
            // event.locals.rabbitChannel = globalThis[GlobalRabbitChannel]
        }
    }

    return await resolve(event)
}
