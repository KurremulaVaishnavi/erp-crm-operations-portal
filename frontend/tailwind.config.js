/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c7ff',
          400: '#85a3ff',
          550: '#4f73ff',
          500: '#3b60e4', // primary action
          600: '#2544c1',
          700: '#1c3298',
          800: '#1b277b',
          900: '#1b2466',
          950: '#10143f',
        }
      }
    },
  },
  plugins: [],
}
