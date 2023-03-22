import { c as create_ssr_component, b as subscribe, d as add_attribute, i as is_promise, n as noop, v as validate_component, e as escape, f as each, g as add_styles } from './index2-7146ef97.js';
import './utils-ae3035df.js';
import { p as page } from './stores-654b7c7e.js';
import 'mupdf-js';

const Pulse = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<svg class="${"text-rose-500"}" width="${"45"}" height="${"45"}" viewBox="${"0 0 45 45"}" xmlns="${"http://www.w3.org/2000/svg"}" stroke="${"currentColor"}"><g fill="${"none"}" fill-rule="${"evenodd"}" transform="${"translate(1 1)"}" stroke-width="${"2"}"><circle cx="${"22"}" cy="${"22"}" r="${"6"}" stroke-opacity="${"0"}"><animate attributeName="${"r"}" begin="${"1.5s"}" dur="${"3s"}" values="${"6;22"}" calcMode="${"linear"}" repeatCount="${"indefinite"}"></animate><animate attributeName="${"stroke-opacity"}" begin="${"1.5s"}" dur="${"3s"}" values="${"1;0"}" calcMode="${"linear"}" repeatCount="${"indefinite"}"></animate><animate attributeName="${"stroke-width"}" begin="${"1.5s"}" dur="${"3s"}" values="${"2;0"}" calcMode="${"linear"}" repeatCount="${"indefinite"}"></animate></circle><circle cx="${"22"}" cy="${"22"}" r="${"6"}" stroke-opacity="${"0"}"><animate attributeName="${"r"}" begin="${"3s"}" dur="${"3s"}" values="${"6;22"}" calcMode="${"linear"}" repeatCount="${"indefinite"}"></animate><animate attributeName="${"stroke-opacity"}" begin="${"3s"}" dur="${"3s"}" values="${"1;0"}" calcMode="${"linear"}" repeatCount="${"indefinite"}"></animate><animate attributeName="${"stroke-width"}" begin="${"3s"}" dur="${"3s"}" values="${"2;0"}" calcMode="${"linear"}" repeatCount="${"indefinite"}"></animate></circle><circle cx="${"22"}" cy="${"22"}" r="${"8"}"><animate attributeName="${"r"}" begin="${"0s"}" dur="${"1.5s"}" values="${"6;1;2;3;4;5;6"}" calcMode="${"linear"}" repeatCount="${"indefinite"}"></animate></circle></g></svg>`;
});
const css = {
  code: "img.svelte-4iaokg{max-width:100%;max-height:15rem;border-radius:0.5rem}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let submitBtn;
  let promise;
  let kmeans_colors = [];
  $$result.css.add(css);
  $$unsubscribe_page();
  return `<main><section><form method="${"POST"}" class="${"flex flex-wrap gap-4 px-[3rem]"}" enctype="${"multipart/form-data"}"><div><input type="${"file"}" name="${"file"}" multiple accept="${"image/*,.pdf"}"></div>

            <input type="${"submit"}" value="${"Submit"}"${add_attribute(
    "class",
    "border rounded px-4 text-gray-500 border-gray-500",
    0
  )} disabled${add_attribute("this", submitBtn, 0)}>
            <input type="${"reset"}" value="${"Reset"}" class="${"border border-gray-500 rounded px-4"}"></form>

        <div class="${"space-y-4"}">${function(__value) {
    if (is_promise(__value)) {
      __value.then(null, noop);
      return `
                <div class="${"grid place-items-center p-[3rem]"}">${validate_component(Pulse, "Pulse").$$render($$result, {}, {}, {})}</div>
                <div class="${"text-center px-[3rem]"}">Generating preview.
                </div>
            `;
    }
    return function(images) {
      return ` 
                <div class="${"preview-container"}"><div class="${"px-[3rem]"}">Files: ${escape(images?.length ?? 0)}</div>
                    ${each(images ?? [], (preview, index) => {
        return `<div class="${"grid place-items-center px-[3rem]"}"><figure class="${"space-y-2"}"><img${add_attribute("src", preview.url, 0)}${add_attribute("alt", preview.name, 0)} class="${"mx-auto svelte-4iaokg"}">
                                <figcaption class="${"text-center"}">${escape(preview.name)}</figcaption>
                            </figure></div>

                        <div class="${"grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 px-[3rem]"}">${each($page.form?.kmeans_colors[index] ?? kmeans_colors[index] ?? [], (pallete) => {
          return `<div><div class="${"p-4"}"${add_styles({ "background-color": pallete.color })}></div>
                                    <div>Hex: ${escape(pallete.hex)}</div>
                                    <div>RGB: ${escape(pallete.rgb)}</div>
                                    <div>CMYK: ${escape(pallete.cmyk)}</div>
                                    <div>${escape(pallete.percentage)}%</div>
                                </div>`;
        })}
                        </div>`;
      })}</div>
            `;
    }(__value);
  }(promise)}</div></section>
</main>`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-60efbdb9.js.map
