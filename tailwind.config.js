/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Deep Teal #097C87 (action color: buttons, nav, focus)
        primary: {
          50:  '#f0f9fa',
          100: '#d0ecef',
          200: '#a1d8de',
          300: '#5fbfca',
          400: '#23ced9',   // bright cyan from palette
          500: '#12a8b4',
          600: '#097c87',   // deep teal — main
          700: '#076570',
          800: '#054e57',
          900: '#033a42',
        },
        // Secondary — Salmon #FCA47C (highlights, badges, accents)
        secondary: {
          50:  '#fff5f0',
          100: '#fee8dc',
          200: '#fdd0b8',
          300: '#fcb898',
          400: '#fca47c',   // salmon from palette
          500: '#f88455',
          600: '#e86535',
          700: '#c44c22',
          800: '#9e3a18',
          900: '#7a2c12',
        },
        // Surface — Warm Yellow #F9D779 (backgrounds, panels)
        surface: {
          50:  '#fefdf5',   // barely-yellow — main app bg
          100: '#fdf8e1',   // light warm yellow — sidebar/header
          200: '#fcf0b8',   // soft yellow — panels
          300: '#f9d779',   // palette yellow — borders/dividers
          400: '#f5c23a',   // deeper yellow accent
        },
        // Sage — #A1CCA6 (success, gentle accents)
        sage: {
          50:  '#f4faf5',
          100: '#dff0e2',
          200: '#c2e0c6',
          300: '#a1cca6',   // sage from palette
          400: '#7db584',
          500: '#5a9d62',
          600: '#3d7d45',
          700: '#2d5e33',
        },
        success: '#5a9d62',
        warning: '#e86535',
        error:   '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
