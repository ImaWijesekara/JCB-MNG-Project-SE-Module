/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jcb: {
          brand: '#FFC222',       // The signature JCB Yellow
          background: '#F8FAFC',  // Slate 50 - Very soft background
          surface: '#FFFFFF',     // Pure White for Cards and Tables
          border: '#E2E8F0',      // Soft, elegant borders
          textMain: '#0F172A',    // Deep, rich Navy/Slate for headers
          textMuted: '#64748B',   // Professional gray for secondary text
          action: '#1E293B'       // Dark slate for buttons
        }
      }
    },
  },
  plugins: [],
}