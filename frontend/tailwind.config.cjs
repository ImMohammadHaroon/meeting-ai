/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: 'rgba(255, 255, 255, 0.2)', // Add this line
                glass: {
                    light: 'rgba(255, 255, 255, 0.1)',
                    border: 'rgba(255, 255, 255, 0.2)',
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}