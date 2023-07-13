import { writable } from "svelte/store"

/**
 * User preference for page transition
 * 
 * @type {import('svelte/store').Writable<?Boolean>} nullable
 */
export const pageTransitionsEnabled = writable(true)

export default {
    pageTransitionsEnabled
}
