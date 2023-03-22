import * as path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import dargs from 'dargs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultBinaryPath = path.join(__dirname, "../bin/kmeans_colors");
const args = (flags = {}) => [].concat(dargs(flags, { useEquals: false })).filter(Boolean);
const create = async (binaryPath) => {
  const fn = async (flags, options) => await fn.exec(flags, options);
  fn.binaryPath = binaryPath;
  fn.exec = async (flags, options) => await execa(binaryPath, args(flags), options);
  return fn;
};
const defaultFlags = (imagepath) => {
  const isString = typeof imagepath === "string" || imagepath instanceof String;
  const isArray = Array.isArray(imagepath);
  if (!isString && !isArray) {
    throw new TypeError("Image path must be a string or array of image path strings.");
  }
  if (isArray) {
    imagepath = imagepath.join(",");
  }
  return {
    "no-file": true,
    print: true,
    rgb: true,
    sort: true,
    pct: true,
    input: imagepath
  };
};
const hexToRgb = (hexstring) => {
  let rgb = hexstring.replace("#", "").match(/.{2}/g);
  for (let i = 0; i < rgb.length; i++) {
    rgb[i] = hexToInt(rgb[i]);
  }
  return rgb;
};
const rgbToCmyk = (rgb) => {
  let b = 1;
  let cmyk = [];
  for (var i = 0; i < rgb.length; i++) {
    let color = 1 - rgb[i] / 255;
    if (color < b)
      b = color;
    if (b === 1)
      color = 1;
    else
      color = (color - b) / (1 - b) * 100;
    cmyk[i] = Math.round(color);
  }
  const cmykDigit = Math.round(b * 100);
  cmyk.push(cmykDigit);
  return cmyk.join(" ");
};
const hexToCmyk = (hexstring) => {
  const rgb = hexToRgb(hexstring);
  return rgbToCmyk(rgb);
};
const hexToInt = (hexstring) => {
  hexstring = (hexstring + "").replace(/[^a-f0-9]/gi, "");
  return parseInt(hexstring, 16);
};
const KmeansColors = await create(defaultBinaryPath);

export { KmeansColors as K, hexToCmyk as a, defaultFlags as d, hexToRgb as h };
//# sourceMappingURL=kmeans-colors-12349870.js.map
