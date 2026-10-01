/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        radar: {
          bg: '#0b0f16',
          card: 'rgba(18, 24, 35, 0.72)',
          border: 'rgba(255, 255, 255, 0.09)',
          critical: '#ff4d4d',
          nearCritical: '#ffb020',
          safe: '#35d07f',
          inProgress: '#4da3ff',
          done: '#9aa6b8'
        }
      }
    },
  },
  plugins: [],
}
