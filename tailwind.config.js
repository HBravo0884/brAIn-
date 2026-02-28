/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Rich Teal (action color)
        primary: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // Secondary — Warm Amber/Gold (from brain icon)
        secondary: {
          50:  '#fefce8',
          100: '#fef9c3',
          200: '#fde4a8',  // lightest brain gold
          300: '#fcd085',
          400: '#f9b84a',
          500: '#e8a030',
          600: '#cc9e5c',  // average brain gold
          700: '#a87840',
          800: '#8a5e2e',
          900: '#6b4420',
        },
        // Surface — warm golden cream backgrounds (brain icon palette)
        surface: {
          50:  '#fffdf7',   // almost white with warmth
          100: '#fef8ec',   // very light gold — main app bg
          200: '#fdf0d5',   // light gold — sidebar / panels
          300: '#fde4a8',   // brain icon light gold
          400: '#f9c96a',   // deeper gold accent
        },
        success: '#059669',
        warning: '#d97706',
        error:   '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
