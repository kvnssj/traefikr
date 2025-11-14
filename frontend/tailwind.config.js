/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        traefik: {
          blue: '#37ABC8',
          dark: '#1A1C1E',
          gray: '#2B2D30',
          light: '#F5F5F5',
        }
      }
    },
  },
  plugins: [],
}