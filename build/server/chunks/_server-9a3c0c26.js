import { j as json } from './index-36410280.js';
import { mkdir, writeFile } from 'node:fs/promises';
import ShortUniqueId from 'short-unique-id';
import { s as storage_path } from './config-2bb217b7.js';
import { k as kmeansColors } from './pdf-b76018b3.js';
import 'path';
import 'url';
import './kmeans-colors-12349870.js';
import 'execa';
import 'dargs';
import 'mupdf-js';
import 'mupdf-js/dist/libmupdf.js';

const saveFromBase64 = async (base64Images) => {
  try {
    const filedir = `${storage_path}/tmp/${new ShortUniqueId()()}`;
    await mkdir(filedir, { recursive: true });
    base64Images.forEach(async (image, index) => {
      const buffer = Buffer.from(image.replace("data:image/png;base64,", ""), "base64");
      await writeFile(`${filedir}/page-${index}.png`, buffer, { flag: "w+" });
    });
    return filedir;
  } catch (error) {
    console.log(error);
  }
};
const POST = async ({ request, locals, cookies }) => {
  const images = await request.json();
  const base64Images = images.map((image) => {
    return image.url;
  });
  const filedir = await saveFromBase64(base64Images);
  let kmeans_colors = [];
  for (let i = 0; i < images.length; i++) {
    const imagepath = `${filedir}/page-${i}.png`;
    const color = await kmeansColors(imagepath);
    kmeans_colors = [...kmeans_colors, color];
  }
  return json({
    kmeans_colors
  });
};

export { POST };
//# sourceMappingURL=_server-9a3c0c26.js.map
