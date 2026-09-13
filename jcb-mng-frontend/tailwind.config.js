/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jcb-yellow': '#FCA311',
        'jcb-dark': '#111827',
        'jcb-surface': '#1F2937'
      }
    },
  },
  plugins: [],
}