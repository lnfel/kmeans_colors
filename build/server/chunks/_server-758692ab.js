import { writeFile, mkdir } from 'node:fs/promises';
import { j as json } from './index-36410280.js';
import { p as prepare, a as pdf2pic } from './pdf-b76018b3.js';
import 'path';
import 'url';
import 'short-unique-id';
import './kmeans-colors-12349870.js';
import 'execa';
import 'dargs';
import 'mupdf-js';
import 'mupdf-js/dist/libmupdf.js';

const POST = async ({ request, locals, cookies }) => {
  const formData = await request.formData();
  const files = formData.getAll("file");
  console.log("pdfjs files: ", files);
  for (let i = 0; i < files.length; i++) {
    try {
      const GhostPrintPDF = await prepare(files[i]);
      await writeFile(GhostPrintPDF.filepath, GhostPrintPDF.buffer, { flag: "w+" });
      await mkdir(GhostPrintPDF.filedir, { recursive: true });
      const data = await pdf2pic(GhostPrintPDF);
      return json(data);
    } catch (error) {
      console.log(error);
    }
  }
};

export { POST };
//# sourceMappingURL=_server-758692ab.js.map
