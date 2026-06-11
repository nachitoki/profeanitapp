/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false, // ¡Crítico para no romper nuestro Glassmorphism!
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
