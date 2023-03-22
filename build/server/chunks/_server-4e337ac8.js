import * as path from 'path';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { j as json } from './index-36410280.js';
import { p as prepare, m as mupdf } from './pdf-b76018b3.js';
import 'short-unique-id';
import './kmeans-colors-12349870.js';
import 'execa';
import 'dargs';
import 'mupdf-js';
import 'mupdf-js/dist/libmupdf.js';

const __filename = fileURLToPath(import.meta.url);
path.dirname(__filename);
const POST = async ({ request, locals, cookies }) => {
  const formData = await request.formData();
  const files = formData.getAll("file");
  console.log("pdfjs files: ", files);
  for (let i = 0; i < files.length; i++) {
    try {
      const GhostPrintPDF = await prepare(files[i]);
      await writeFile(GhostPrintPDF.filepath, GhostPrintPDF.buffer, { flag: "w+" });
      await mkdir(GhostPrintPDF.filedir, { recursive: true });
      const data = await mupdf(GhostPrintPDF);
      return json(data);
    } catch (error) {
      console.log(error);
    }
  }
};

export { POST };
//# sourceMappingURL=_server-4e337ac8.js.map
