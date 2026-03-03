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
        // Our palette — 5 exact colors
        // #097C87 deep teal, #23CED9 bright cyan, #F9D779 yellow, #A1CCA6 sage, #FCA47C salmon

        // PRIMARY — deep teal (used as primary-* throughout app)
        primary: {
          50:  '#f0f9fa',
          100: '#d0ecef',
          200: '#a1d8de',
          300: '#5fbfca',
          400: '#23ced9',
          500: '#12a8b4',
          600: '#097c87',
          700: '#076570',
          800: '#054e57',
          900: '#033a42',
        },

        // REMAP blue → teal (most components use blue-*)
        blue: {
          50:  '#f0f9fa',
          100: '#d0ecef',
          200: '#a1d8de',
          300: '#5fbfca',
          400: '#23ced9',
          500: '#12a8b4',
          600: '#097c87',
          700: '#076570',
          800: '#054e57',
          900: '#033a42',
        },

        // REMAP indigo → deep teal (GlobalAIEditor, BriefingGenerator use indigo-*)
        indigo: {
          50:  '#f0f9fa',
          100: '#d0ecef',
          200: '#a1d8de',
          300: '#5fbfca',
          400: '#23ced9',
          500: '#12a8b4',
          600: '#097c87',
          700: '#076570',
          800: '#054e57',
          900: '#033a42',
        },

        // REMAP teal → same (already teal)
        teal: {
          50:  '#f0f9fa',
          100: '#d0ecef',
          200: '#a1d8de',
          300: '#5fbfca',
          400: '#23ced9',
          500: '#12a8b4',
          600: '#097c87',
          700: '#076570',
          800: '#054e57',
          900: '#033a42',
        },

        // REMAP cyan → bright cyan variant
        cyan: {
          50:  '#f0fdfe',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#23ced9',
          500: '#12a8b4',
          600: '#097c87',
          700: '#076570',
          800: '#054e57',
          900: '#033a42',
        },

        // REMAP purple → salmon (BriefingGenerator uses purple-*)
        purple: {
          50:  '#fff5f0',
          100: '#fee8dc',
          200: '#fdd0b8',
          300: '#fcb898',
          400: '#fca47c',
          500: '#f88455',
          600: '#e86535',
          700: '#c44c22',
          800: '#9e3a18',
          900: '#7a2c12',
        },

        // REMAP violet → salmon (used in NotebookLMImport)
        violet: {
          50:  '#fff5f0',
          100: '#fee8dc',
          200: '#fdd0b8',
          300: '#fcb898',
          400: '#fca47c',
          500: '#f88455',
          600: '#e86535',
          700: '#c44c22',
          800: '#9e3a18',
          900: '#7a2c12',
        },

        // REMAP orange/amber → salmon warm tones
        orange: {
          50:  '#fff5f0',
          100: '#fee8dc',
          200: '#fdd0b8',
          300: '#fcb898',
          400: '#fca47c',
          500: '#f88455',
          600: '#e86535',
          700: '#c44c22',
          800: '#9e3a18',
          900: '#7a2c12',
        },
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#f9d779',
          400: '#f5c23a',
          500: '#e8a030',
          600: '#c47d18',
          700: '#9a5f10',
          800: '#78450c',
          900: '#5c3308',
        },

        // REMAP yellow → palette yellow #F9D779
        yellow: {
          50:  '#fefdf5',
          100: '#fdf8e1',
          200: '#fcf0b8',
          300: '#f9d779',
          400: '#f5c23a',
          500: '#e8a030',
          600: '#c47d18',
          700: '#9a5f10',
          800: '#78450c',
          900: '#5c3308',
        },

        // REMAP green → sage #A1CCA6
        green: {
          50:  '#f4faf5',
          100: '#dff0e2',
          200: '#c2e0c6',
          300: '#a1cca6',
          400: '#7db584',
          500: '#5a9d62',
          600: '#3d7d45',
          700: '#2d5e33',
          800: '#1f4324',
          900: '#142e18',
        },

        // REMAP emerald → sage (used in NotebookLMImport, BriefingGenerator)
        emerald: {
          50:  '#f4faf5',
          100: '#dff0e2',
          200: '#c2e0c6',
          300: '#a1cca6',
          400: '#7db584',
          500: '#5a9d62',
          600: '#3d7d45',
          700: '#2d5e33',
          800: '#1f4324',
          900: '#142e18',
        },

        // REMAP gray → cool slate neutrals
        gray: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },

        // Surface utilities — neutral cool grays
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
        },

        success: '#5a9d62',
        warning: '#e86535',
        error:   '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'page':    ['1.75rem', { lineHeight: '2rem',   fontWeight: '700' }],
        'section': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'label':   ['0.75rem',  { lineHeight: '1rem',   fontWeight: '500', letterSpacing: '0.05em' }],
      },
    },
  },
  plugins: [],
}
