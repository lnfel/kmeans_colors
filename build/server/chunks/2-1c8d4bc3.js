import { writeFile } from 'node:fs/promises';
import { K as KmeansColors, d as defaultFlags, h as hexToRgb, a as hexToCmyk } from './kmeans-colors-12349870.js';
import { s as storage_path } from './config-2bb217b7.js';
import 'path';
import 'url';
import 'execa';
import 'dargs';

const load = async ({ locals }) => {
  return {};
};
const actions = {
  /**
   * Save file to disk using node async writeFile
   * https://stackoverflow.com/questions/40137880/save-video-blob-to-filesystem-electron-node-js
   * 
   * Node Filesystem flags
   * https://nodejs.org/dist/latest-v18.x/docs/api/fs.html#file-system-flags
   */
  default: async ({ request, locals, cookies }) => {
    const formData = await request.formData();
    const files = formData.getAll("file");
    const filenames = formData.getAll("filenames");
    console.log("server files: ", files);
    console.log("server filenames: ", filenames);
    console.log("KmeansColors: ", KmeansColors);
    let kmeans_colors = [];
    for (let i = 0; i < files.length; i++) {
      const buffer = Buffer.from(await files[i].arrayBuffer());
      const extension = files[i].type.replace("image/", "");
      const filepath = `${storage_path}/tmp/file-${i}.${extension}`;
      await writeFile(filepath, buffer, { flag: "w+" });
      const flags = defaultFlags(filepath);
      const { stdout } = await KmeansColors.exec(flags);
      console.log(stdout);
      let kmeans = stdout.split("\n");
      let colors = kmeans[0].split(",");
      let percentage = kmeans[1].split(",");
      let color = colors.map((color2, index) => {
        const hexstring = `#${color2}`;
        return {
          color: hexstring,
          hex: hexstring,
          rgb: hexToRgb(hexstring).join(" "),
          cmyk: hexToCmyk(hexstring),
          percentage: (percentage[index] * 100).toFixed(2)
        };
      });
      kmeans_colors = [...kmeans_colors, color];
    }
    return {
      kmeans_colors
    };
  }
};

var _page_server = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

const index = 2;
const component = async () => (await import('./_page.svelte-60efbdb9.js')).default;
const file = '_app/immutable/entry/_page.svelte.91eebf0e.js';
const server_id = "src/routes/+page.server.js";
const imports = ["_app/immutable/entry/_page.svelte.91eebf0e.js","_app/immutable/chunks/index.acd01143.js","_app/immutable/chunks/parse.d12b0d5b.js","_app/immutable/chunks/singletons.33481361.js","_app/immutable/chunks/stores.4916bcc8.js"];
const stylesheets = ["_app/immutable/assets/_page.080cde0c.css"];
const fonts = [];

export { component, file, fonts, imports, index, _page_server as server, server_id, stylesheets };
//# sourceMappingURL=2-1c8d4bc3.js.map
