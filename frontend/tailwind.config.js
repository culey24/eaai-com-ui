/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1488D8',
        secondary: '#030391',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgb(0 0 0 / 0.07), 0 10px 20px -2px rgb(0 0 0 / 0.04)',
        'glow-primary': '0 4px 20px -2px rgb(20 136 216 / 0.35)',
        'glow-secondary': '0 4px 24px -2px rgb(3 3 145 / 0.25)',
      },
    },
  },
  plugins: [],
}
