import { redirect } from '@sveltejs/kit'
// import { OAuth2Client } from 'google-auth-library'
import { luciaAuth, googleAuth, aerialGoogleAuth } from '$lib/aerial/server/lucia.js'
import { google_client_secret, app_url, google_oauth_callback_path } from '$lib/config.js'
// import { validateCallback } from '$lib/aerial/server/oauth/google/index.js'
import { airy } from '$lib/aerial/hybrid/util.js'

/**
 * Sign Up / In with Google! | SvelteKit OAuth 2.0
 * 
 * https://www.youtube.com/watch?v=4QwcC4hfqM0
 * 
 * @type {import('@sveltejs/kit').RequestHandler}
 */
// export const GET = async ({ url }) => {
//     const redirect_uri = `${url.origin}/_auth/callback`
//     const code = url.searchParams.get('code')
//     airy({ message: code, label: '[Google OAuth] Code:' })

//     try {
//         const oauthClient = new OAuth2Client({
//             clientId: google_client_secret.web.client_id,
//             clientSecret: google_client_secret.web.client_secret,
//             redirectUri: redirect_uri
//         })

//         const oauthTokenResponse = await oauthClient.getToken(code)
//         oauthClient.setCredentials(oauthTokenResponse.tokens)

//         const user = oauthClient.credentials
//         airy({ message: user, label: '[Google OAuth] user credentials:' })
//     } catch (error) {
//         airy({ message: error.message, label: '[Google OAuth] Login error:' })
//     }

//     throw redirect(303, '/')
// }

/**
 * Lucia OAuth
 * 
 * https://lucia-auth.com/oauth/start-here/getting-started?sveltekit#authenticate-user
 * 
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const GET = async ({ cookies, url, locals }) => {
    // check if we already has a session going
    // const session = await locals?.luciaAuth?.validate()
    // airy({ message: session, label: '[Google OAuth Callback] Session:' })
    // if (session) {
    //     return new Response(null, {
    //         status: 302,
    //         headers: {
    //             Location: '/'
    //         }
    //     })
    // }
    // get code and state params from url
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    airy({ message: code, label: '[Google OAuth Callback] Code:' })
    airy({ message: state, label: '[Google OAuth Callback] State:' })

    // get stored state from cookies
    const storedState = cookies.get("google_oauth_state")
    airy({ message: storedState, label: '[Google OAuth Callback] Stored state:' })

    // validate state
    if (!state || !storedState || state !== storedState) {
        throw new Response(null, { status: 401 })
    }

    try {
        const { existingUser, providerUser, createUser, createPersistentKey, tokens } = await googleAuth.validateCallback(code)
        airy({ message: existingUser, label: '[Google OAuth Callback] Existing user:' })
        airy({ message: providerUser, label: '[Google OAuth Callback] Google user:' })
        const getUser = async () => {
            if (existingUser) return existingUser
            // create a new user if the user does not exist
            const user = await createUser({
                // attributes
                name: providerUser.name,
                picture: providerUser.picture
            })
            /**
             * Add provider to existing user
             * 
             * https://lucia-auth.com/oauth/start-here/getting-started?sveltekit#add-provider-to-existing-user
             */
            // await createPersistentKey(user.id)
            return user
        }

        const user = await getUser()
        const session = await luciaAuth.createSession(user.id)
        airy({ message: session, label: '[Google OAuth Callback] createSession Session:' })
        locals.luciaAuth.setSession(session)
        airy({ message: locals, label: '[Google OAuth Callback] Locals:' })
    } catch (error) {
        console.log(error)
        return new Response(null, {
            status: 500
        })
    }

    throw redirect(302, "/")
}

/**
 * 
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export const POST = async ({ cookies, locals, request }) => {
    const formData = await request.formData()
    const code = formData.get('code')
    const state = formData.get("state")
    airy({ message: code, label: '[Google OAuth Callback] Code:' })
    airy({ message: state, label: '[Google OAuth Callback] State:' })

    // get stored state from cookies
    const storedState = cookies.get("google_oauth_state")
    airy({ message: storedState, label: '[Google OAuth Callback] Stored state:' })

    // validate state
    if (!state || !storedState || state !== storedState) {
        throw new Response(null, { status: 401 })
    }

    try {
        const { existingUser, providerUser, createUser, createPersistentKey, tokens } = await aerialGoogleAuth.validateCallback(code)
        // const { existingUser, providerUser, createUser, createPersistentKey, tokens } = await validateCallback(code)
        // const { existingUser, providerUser, createUser, createPersistentKey, tokens } = await googleAuth.validateCallback(code)
        airy({ message: existingUser, label: '[Google OAuth Callback] Existing user:' })
        airy({ message: providerUser, label: '[Google OAuth Callback] Google user:' })
        const getUser = async () => {
            if (existingUser) return existingUser
            // create a new user if the user does not exist
            const user = await createUser({
                // attributes
                name: providerUser.name,
                picture: providerUser.picture
            })
            /**
             * Add provider to existing user
             * 
             * https://lucia-auth.com/oauth/start-here/getting-started?sveltekit#add-provider-to-existing-user
             */
            // await createPersistentKey(user.id)
            return user
        }

        const user = await getUser()
        const session = await luciaAuth.createSession(user.id)
        airy({ message: session, label: '[Google OAuth Callback] createSession Session:' })
        locals.luciaAuth.setSession(session)
        // airy({ message: locals, label: '[Google OAuth Callback] Locals:' })
    } catch (error) {
        console.log(error.message ?? error)
        return new Response(null, {
            status: 500
        })
    }

    throw redirect(302, "/")
}
