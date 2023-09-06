import { AuthRequest } from 'lucia'

declare global {
    declare namespace App {
        interface Locals {
            luciaAuth: AuthRequest<Lucia.Auth>;
            googleOauthClient: import('googleapis').Auth.OAuth2Client;
            wss: import('ws').Server;
            // Probably change this to something like `push: { message: String }`
            session: { message: String };
        }

        interface PageData {
            url: URL|string;
            user?: import('lucia').UserSchema;
            client_id?: string;
            // access_token?: string;
            // refresh_token?: string;
            aerial_token?: string;
            streamed: {
                aerialFolder?: Promise<Aerial.Folder>;
                storageQuota?: Promise<Aerial.StorageQuota>;
            },
            artifacts?: Aerial.FormattedArtifacts;
        }

        interface Platform {}
    }
    declare namespace Lucia {
        type Auth = import('lucia').Auth<import('lucia').Configuration>;
        type UserAttributes = {
            name: string;
            // google_username: string;
            picture: string;
        };
        type DatabaseSessionAttributes = {};
    }
    declare namespace Aerial {
        type Artifact = import('@prisma/client').Artifact;
        type ArtifactType = import('@prisma/client').ArtifactType;
        type FormattedArtifacts = {
            pages: {
                url: string;
                colors: any;
                cmyk: {
                    total: any;
                    summary: any;
                    whiteSpace: any;
                    coloredSpace: any;
                };
                description: string;
            }[];
            id: string;
            label: string;
            type: Aerial.ArtifactType;
            created_at: string;
            updated_at: string;
        }[];
        type Folder = {
            files: import('googleapis').drive_v3.Schema$File[],
            totalSizeInBytes: number;
            totalSize: string;
            id: string;
        };
        type StorageQuota = {
            limit: string;
            usage: string;
            usageInDrive: string;
            usageInDriveTrash: string;
            occupiedSpace: number;
        };
    }
}
