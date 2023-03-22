import { writeFile, mkdir } from 'node:fs/promises';
import { j as json } from './index-36410280.js';
import { p as prepare, b as preview } from './pdf-b76018b3.js';
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
      const { buffer, arrayBuffer, filepath, filedir } = await prepare(files[i]);
      await writeFile(filepath, buffer, { flag: "w+" });
      await mkdir(filedir, { recursive: true });
      const data = await preview(arrayBuffer, filedir);
      return json(data);
    } catch (error) {
      console.log(error);
    }
  }
};

export { POST };
//# sourceMappingURL=_server-8c745c8f.js.map
