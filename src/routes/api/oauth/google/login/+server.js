import { luciaAuth, googleAuth } from '$lib/aerial/server/lucia.js'
import { localservices } from 'googleapis/build/src/apis/localservices'
import { dev } from '$app/environment'
import { google_oauth_callback_path } from '$lib/config.js'

/**
 * Sign in with Google OAuth Provider
 * 
 * https://lucia-auth.com/oauth/start-here/getting-started?sveltekit#sign-in-with-the-provider
 * https://github.com/pilcrowOnPaper/lucia/blob/main/examples/sveltekit/github-oauth/src/routes/login/github/%2Bserver.ts
 * 
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const GET = async ({ cookies, url, locals }) => {
    // check if we already has a session going
    const session = await locals?.luciaAuth?.validate()
    if (session) {
        return new Response(null, {
            status: 302,
            headers: {
                Location: '/'
            }
        })
    }

    // get url to redirect the user to, with the state
    const [googleAuthURL, state] = await googleAuth.getAuthorizationUrl(`${url.origin}${google_oauth_callback_path}`)

    // the state can be stored in cookies or localstorage for request validation on callback
    cookies.set("google_oauth_state", state, {
        httpOnly: true,
        secure: !dev,
        path: '/',
        maxAge: 60 * 60
    })

    // redirect to authorization url
    return new Response(null, {
        status: 302,
        headers: {
            Location: googleAuthURL.toString()
        }
    })
}