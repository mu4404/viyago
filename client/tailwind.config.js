/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0B0F19',
        cardBg: 'rgba(30, 41, 59, 0.5)',
      }
    },
  },
  plugins: [],
}
