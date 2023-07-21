import { AuthRequest, Auth, Configuration } from "lucia-auth"

// <Auth<Configuration>>
declare global {
    declare namespace App {
        interface Locals {
            luciaAuth: AuthRequest
        }

        interface PageData {
            user?: import('lucia-auth').UserSchema;
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
