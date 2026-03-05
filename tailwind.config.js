/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1C1917', // Deep Stone
        secondary: '#57534E', // Muted Slate
        accent: '#D4A373', // Elegant Gold
        highlight: '#E29578', // Muted Rose
        background: '#FAFAF9', // Warm White
        surface: '#FFFFFF', // Pure White
        muted: '#F5F5F4', // Soft Gray
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Lato"', 'sans-serif'],
      },
      letterSpacing: {
        widest: '.25em',
      },
    },
  },
  plugins: [],
}
