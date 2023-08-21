
declare global {
    declare namespace App {
        interface Locals {
            luciaAuth: import('lucia').AuthRequest;
            googleOauthClient: import('googleapis').Auth.OAuth2Client;
            wss: import('ws').Server;
        }

        interface PageData {
            url: URL|string;
            user?: import('lucia').UserSchema;
            client_id?: string;
            access_token?: string;
            refresh_token?: string;
            streamed: {
                aerialFolder?: Promise<{
                    files: import('googleapis').drive_v3.Schema$File[],
                    totalSizeInBytes: number;
                    totalSize: string;
                    id: string;
                }>;
                storageQuota?: Promise<{
                    limit: string;
                    usage: string;
                    usageInDrive: string;
                    usageInDriveTrash: string;
                    occupiedSpace: number;
                }>;
            }
        }

        interface Platform {}
    }
    declare namespace Lucia {
        type Auth = import('lucia').Auth;
        type UserAttributes = {
            name: string;
            // google_username: string;
            picture: string;
        };
        type DatabaseSessionAttributes = {};
    }
}
