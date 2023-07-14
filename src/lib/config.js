import * as path from "path"
import { fileURLToPath } from "url"
import { STORAGE_PATH } from "$env/static/private"
// import { platform as currentPlatform } from "os"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const storage_path = path.join(__dirname, `../../${STORAGE_PATH}`)
// export const env = process.env.NODE_ENV
// export const env = import.meta.env.MODE
// export const platform = currentPlatform()
