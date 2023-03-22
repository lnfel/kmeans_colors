import * as path from 'path';
import { fileURLToPath } from 'url';
import { writeFile } from 'node:fs/promises';
import ShortUniqueId from 'short-unique-id';
import { d as defaultFlags, K as KmeansColors, h as hexToRgb, a as hexToCmyk } from './kmeans-colors-12349870.js';
import 'mupdf-js';
import 'mupdf-js/dist/libmupdf.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prepare = async (blob, filename, tempdir) => {
  console.log("prepare");
  const extension = blob.type.replace("application/", "");
  const hash = new ShortUniqueId()();
  filename = filename ?? `pdf-${hash}`;
  tempdir = tempdir ?? "storage/tmp/";
  const filedir = `${tempdir}${filename}`;
  const filepath = `${filedir}.${extension}`;
  return {
    buffer: Buffer.from(await blob.arrayBuffer()),
    arrayBuffer: await blob.arrayBuffer(),
    extension,
    filename,
    tempdir,
    filedir,
    filepath,
    hash
  };
};
const preview = async (arrayBuffer, filedir, format = "image/png", scale = 0.1) => {
  console.log("preview");
  const images = await bufferToBase64(arrayBuffer);
  await saveToTemp(images, filedir);
  let kmeans_colors = [];
  console.log("kmeansColors");
  for (let i = 0; i < images.length; i++) {
    const imagepath = path.join(__dirname, `../../../../${filedir}/page-${i}.png`);
    const color = await kmeansColors(imagepath);
    kmeans_colors = [...kmeans_colors, color];
  }
  return {
    images,
    kmeans_colors
  };
};
const kmeansColors = async (imagepath) => {
  const flags = defaultFlags(imagepath);
  const { stdout } = await KmeansColors.exec(flags);
  const kmeans = stdout.split("\n");
  const colors = kmeans[0].split(",");
  const percentage = kmeans[1].split(",");
  const color = colors.map((color2, index) => {
    const hexstring = `#${color2}`;
    return {
      color: hexstring,
      hex: hexstring,
      rgb: hexToRgb(hexstring).join(" "),
      cmyk: hexToCmyk(hexstring),
      percentage: (percentage[index] * 100).toFixed(2)
    };
  });
  return color;
};
const bufferToBase64 = async (arrayBuffer, format = "image/png", scale = 0.1) => {
  console.log("bufferToBase64");
  return new Promise(async (resolve, reject) => {
    try {
      const before = Date.now();
      let images = [];
      const { pdf, pages, viewport } = await pdfJsDocument(arrayBuffer, scale);
      for (let i = 1; i < pages; i++) {
        const canvas = createCanvas(viewport.width, viewport.height);
        const canvasContext = canvas.getContext("2d");
        const page = await pdf.getPage(i);
        const renderTask = page.render({
          canvasContext,
          viewport
        });
        await renderTask.promise.then(() => {
          return images = [...images, canvas.toDataURL()];
        });
      }
      const after = Date.now();
      console.log(`bufferToBase64 done in ${Math.round((after - before) / 1e3)}s`);
      resolve(images);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
};
const pdfJsDocument = async (arrayBuffer, scale = 0.1) => {
  console.log("pdfJsDocument");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker";
  const loadingTask = pdfjsLib.getDocument(arrayBuffer);
  const pdf = await loadingTask.promise;
  const firstPage = await pdf.getPage(1);
  return {
    pdf,
    pages: pdf._pdfInfo.numPages,
    viewport: firstPage.getViewport({ scale })
  };
};
const saveToTemp = async (images, filedir) => {
  console.log("saveToTemp");
  return new Promise((resolve, reject) => {
    try {
      images.forEach(async (image, index) => {
        const buffer = Buffer.from(image.replace("data:image/png;base64,", ""), "base64");
        await writeFile(`${filedir}/page-${index}.png`, buffer, { flag: "w+" });
        resolve();
      });
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
};
const pdf2pic = async (GhostPrintPDF) => {
  const pdfJsDocumentbefore = Date.now();
  const { pdf, pages, viewport } = await pdfJsDocument(GhostPrintPDF.arrayBuffer, 0.1);
  const pdfJsDocumentafter = Date.now();
  console.log(`pdfJsDocument done in ${Math.round((pdfJsDocumentafter - pdfJsDocumentbefore) / 1e3)}s`);
  const options = {
    saveFilename: "page",
    savePath: GhostPrintPDF.filedir,
    format: "png",
    width: viewport.width,
    height: viewport.height
  };
  console.log("options: ", options);
  const isBase64 = true;
  let images = [];
  const pdf2pic2 = pdf2picFromBuffer(GhostPrintPDF.buffer, options);
  console.log("pdf2pic: ", pdf2pic2);
  const pdf2picbefore = Date.now();
  for (let i = 1; i < pages; i++) {
    const image = await pdf2pic2(i, isBase64);
    images = [...images, `data:image/png;base64,${image.base64}`];
  }
  const pdf2picafter = Date.now();
  console.log(`pdf2pic done in ${Math.round((pdf2picafter - pdf2picbefore) / 1e3)}s`);
  const saveToTempbefore = Date.now();
  await saveToTemp(images, GhostPrintPDF.filedir);
  const saveToTempafter = Date.now();
  console.log(`saveToFolder done in ${Math.round((saveToTempafter - saveToTempbefore) / 1e3)}s`);
  const kmeansColorsbefore = Date.now();
  let kmeans_colors = [];
  console.log("kmeansColors");
  for (let i = 0; i < images.length; i++) {
    const imagepath = path.join(__dirname, `../../../../${GhostPrintPDF.filedir}/page-${i}.png`);
    const color = await kmeansColors(imagepath);
    kmeans_colors = [...kmeans_colors, color];
  }
  const kmeansColorsafter = Date.now();
  console.log(`kmeansColors done in ${Math.round((kmeansColorsafter - kmeansColorsbefore) / 1e3)}s`);
  return {
    images,
    kmeans_colors
  };
};
const mupdf = async (GhostPrintPDF) => {
  try {
    return {
      images: []
      // kmeans_colors
    };
  } catch (error) {
    console.log(error);
    return {
      images: []
    };
  }
};

export { pdf2pic as a, preview as b, kmeansColors as k, mupdf as m, prepare as p };
//# sourceMappingURL=pdf-b76018b3.js.map
