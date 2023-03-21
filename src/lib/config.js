import * as path from "path"
import { fileURLToPath } from "url"
import { STORAGE_PATH } from "$env/static/private"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const storage_path = path.join(__dirname, `../../${STORAGE_PATH}`)