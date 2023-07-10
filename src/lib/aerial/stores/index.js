import { writable } from "svelte/store"

/**
 * @type {import('svelte/store').Writable<?Boolean>} nullable
 */
export const pageTransitionsEnabled = writable(true)


export default {
    pageTransitionsEnabled
}
