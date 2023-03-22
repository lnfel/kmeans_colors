import * as path from 'path';
import { fileURLToPath } from 'url';

const STORAGE_PATH = "storage";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage_path = path.join(__dirname, `../../${STORAGE_PATH}`);

export { storage_path as s };
//# sourceMappingURL=config-2bb217b7.js.map
