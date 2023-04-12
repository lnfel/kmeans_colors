/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            colors: {
                /**
                 * https://uicolors.app/create
                 * #9364b9
                 */
                'wisteria': {
                    '50': '#f4f2fb',
                    '100': '#ece8f7',
                    '200': '#ddd5f0',
                    '300': '#c9bbe6',
                    '400': '#b79fda',
                    '500': '#a886ce',
                    '600': '#9364b9',
                    '700': '#875ca6',
                    '800': '#6c4d86',
                    '900': '#58436c',
                    '950': '#34273f',
                },                
            }
        },
    },
    plugins: [],
}
