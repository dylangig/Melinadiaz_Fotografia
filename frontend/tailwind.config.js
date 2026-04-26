/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pink: {
          50:  '#fce4ec',
          100: '#f8bbd0',
          200: '#f48fb1',
          300: '#f06292',
          400: '#ec407a',
          500: '#e91e8c',
          600: '#e91e63',
          700: '#d81b60',
          800: '#c2185b',
          900: '#ad1457',
          950: '#880e4f',
        },
        rose: {
          dark: '#6d3a4f',
          deep: '#4a0e25',
        }
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        inter: ['Inter', 'sans-serif'],
        montserrat: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
