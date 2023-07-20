import { fail, json } from '@sveltejs/kit'
import { luciaAuth } from '$lib/aerial/server/lucia.js'

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const POST = async ({ locals, cookies }) => {
    const session = await locals.luciaAuth.validate()
    if (!session) return fail(401)
    // invalidate session
    await luciaAuth.invalidateSession(session.sessionId)
    // remove cookie
    locals.luciaAuth.setSession(null)
    cookies.delete("google_oauth_state", {
        path: '/'
    })
    return json({ message: 'Successfully signed out.' })
}