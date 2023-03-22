const manifest = {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","font/Hack-Regular.ttf","libmupdf.wasm"]),
	mimeTypes: {".png":"image/png",".ttf":"font/ttf",".wasm":"application/wasm"},
	_: {
		client: {"start":{"file":"_app/immutable/entry/start.e491a8f8.js","imports":["_app/immutable/entry/start.e491a8f8.js","_app/immutable/chunks/index.acd01143.js","_app/immutable/chunks/singletons.33481361.js","_app/immutable/chunks/parse.d12b0d5b.js"],"stylesheets":[],"fonts":[]},"app":{"file":"_app/immutable/entry/app.4e65dcd3.js","imports":["_app/immutable/entry/app.4e65dcd3.js","_app/immutable/chunks/index.acd01143.js"],"stylesheets":[],"fonts":[]}},
		nodes: [
			() => import('./chunks/0-53145159.js'),
			() => import('./chunks/1-062dee06.js'),
			() => import('./chunks/2-1c8d4bc3.js')
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0], errors: [1], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/kmeans_colors",
				pattern: /^\/api\/kmeans_colors\/?$/,
				params: [],
				page: null,
				endpoint: () => import('./chunks/_server-9a3c0c26.js')
			},
			{
				id: "/api/magick/pdf-to-image",
				pattern: /^\/api\/magick\/pdf-to-image\/?$/,
				params: [],
				page: null,
				endpoint: () => import('./chunks/_server-4ed993c7.js')
			},
			{
				id: "/api/mupdf",
				pattern: /^\/api\/mupdf\/?$/,
				params: [],
				page: null,
				endpoint: () => import('./chunks/_server-4e337ac8.js')
			},
			{
				id: "/api/pdf2pic",
				pattern: /^\/api\/pdf2pic\/?$/,
				params: [],
				page: null,
				endpoint: () => import('./chunks/_server-758692ab.js')
			},
			{
				id: "/api/pdfjs",
				pattern: /^\/api\/pdfjs\/?$/,
				params: [],
				page: null,
				endpoint: () => import('./chunks/_server-8c745c8f.js')
			},
			{
				id: "/pdf-to-image",
				pattern: /^\/pdf-to-image\/?$/,
				params: [],
				page: null,
				endpoint: () => import('./chunks/_server-c42ce534.js')
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
};

const prerendered = new Set([]);

export { manifest, prerendered };
//# sourceMappingURL=manifest.js.map
