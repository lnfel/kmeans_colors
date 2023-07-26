import { AuthRequest, Auth, Configuration } from "lucia-auth"

// <Auth<Configuration>>
declare global {
    declare namespace App {
        interface Locals {
            luciaAuth: AuthRequest
        }

        interface PageData {
            url: URL|string;
            user?: import('lucia-auth').UserSchema;
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
        type Auth = Auth<Configuration>
        type UserAttributes = {
            name: string;
            picture: string;
        }
    }
}
