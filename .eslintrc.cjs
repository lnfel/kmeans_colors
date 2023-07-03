module.exports = {
	root: true,
	extends: ['eslint:recommended', 'plugin:svelte/recommended'],
    rules: {
        "no-extra-parens": 0,
        "no-unexpected-multiline": 0,
        "no-unused-vars": ["off", {
            "args": "none"
        }],
        "no-async-promise-executor": 0
    },
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
		extraFileExtensions: ['.svelte']
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	},
    /**
     * no-undef complains about globalThis
     * https://github.com/eslint/eslint/issues/11553
     */
    "globals": {
        "globalThis": false
    }
};
