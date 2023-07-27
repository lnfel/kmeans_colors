import { writable } from "svelte/store"

/**
 * User preference for page transition
 * 
 * @see ../component/Header.svelte for implementation
 * @type {import('svelte/store').Writable<?Boolean>} nullable
 */
export const pageTransitionsEnabled = writable(true)

/**
 * Dev preference for testing layout transitions
 * 
 * @see ../component/Header.svelte for implementation
 * @type {import('svelte/store').Writable<?Boolean>} nullable
 */
export const devLayoutTestEnabled = writable(false)

export const menuExpanded = writable(false)

export default {
    pageTransitionsEnabled
}
