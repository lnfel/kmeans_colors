// import { hydrateAuth } from 'svelte-google-auth/server'
// import { getOAuth2Client, isSignedIn } from 'svelte-google-auth'
import { google } from 'googleapis'
import { listStorageQuota, listAerialFolderDetails } from '$lib/aerial/server/google/drive.js'
import { luciaAuth, googleAuthConfig } from '$lib/aerial/server/lucia.js'
import prisma from '$lib/prisma.js'
import { airy } from '$lib/aerial/hybrid/util.js'
import { google_client_secret, app_url, google_oauth_callback_path } from '$lib/config.js'

/**
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export const load = async ({ locals, url, depends }) => {
    let driveFiles, storageQuota, aerialFolder, googleOauthClient, aerial_token
    const session = await locals.luciaAuth.validate()
    // airy({ message: locals.luciaAuth, label: '[Layout load] Lucia Auth:' })
    // airy({ message: session, label: '[Layout load] Session:' })
    if (session?.user) {
        const [ authKey ] = (await luciaAuth.getAllUserKeys(session.user.id)).filter((key) => key.providerId === 'google')
        const { access_token, refresh_token, expiry_date, aerial_token: aerialToken } = await prisma.authToken.findFirst({
            where: {
                key_id: `${authKey.providerId}:${authKey.providerUserId}`
            }
        })
        aerial_token = aerialToken
        // airy({ message: authKey, label: '[Layout load] AuthKey:' })
        // airy({ message: access_token, label: '[Layout load] Access token:' })
        googleOauthClient = new google.auth.OAuth2(
            google_client_secret.web.client_id,
            google_client_secret.web.client_secret,
            `${app_url}${google_oauth_callback_path}`
        )
        googleOauthClient.setCredentials({
            access_token,
            refresh_token,
            expiry_date,
            // id_token,
            token_type: 'Bearer',
            scope: googleAuthConfig.scope.join(' ')
        })
        // const newToken = await googleOauthClient.getAccessToken()
        // airy({ message: googleOauthClient, label: '[Layout load] googleOauthClient:' })
        // airy({ message: newToken, label: '[Layout load] newToken:' })

        // driveFiles = listDriveFiles(googleOauthClient)
        storageQuota = listStorageQuota(googleOauthClient)
        aerialFolder = listAerialFolderDetails(googleOauthClient)
    }
    
    depends('layout:data')

    return {
        // By calling hydateAuth, certain variables from locals are parsed to the client
        // allowing the client to access the user information and the client_id for login
        // ...hydrateAuth(locals),
        // Sveltekit streaming promises for blazingly fast page navigation
        streamed: {
            storageQuota,
            aerialFolder,
        },
        // We must know the pathname change beforehand for the page transition to be accurate
        url: url.pathname,
        user: session?.user,
        client_id: googleOauthClient?._clientId,
        access_token: googleOauthClient?.credentials?.access_token,
        // refresh_token: googleOauthClient?.credentials?.refresh_token,
        aerial_token,
        session: locals.session ?? null,
    }
}
