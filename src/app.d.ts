import { AuthRequest, Auth, Configuration } from "lucia-auth"

declare global {
    declare namespace App {
        interface Locals {
            luciaAuth: AuthRequest<Auth<Configuration>>
        }

        interface PageData {}

        interface Platform {}
    }
}
