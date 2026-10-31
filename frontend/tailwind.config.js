import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  // Pas de dark mode automatique — palette lumineuse uniquement
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        // Primaire — bleu ciel vibrant
        primary: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',   // CTA par défaut
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          DEFAULT: '#0284c7',
        },

        // Fonds
        canvas: '#ffffff',      // fond principal
        muted:  '#f0f9ff',      // fond secondaire bleu glacé très clair

        // Statuts
        status: {
          available: '#16a34a',
          pending:   '#d97706',
          rejected:  '#dc2626',
          validated: '#059669',
        },
      },

      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },

      boxShadow: {
        card:       '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 12px 30px -4px rgb(2 132 199 / 0.15), 0 4px 12px -2px rgb(0 0 0 / 0.06)',
        soft:       '0 2px 10px 0 rgb(0 0 0 / 0.05)',
        elevated:   '0 20px 40px -15px rgb(15 23 42 / 0.08), 0 0 1px 1px rgb(15 23 42 / 0.05)',
        modal:      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },

      keyframes: {
        'heart-pop': {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'heart-pop': 'heart-pop 0.25s ease-in-out',
      },
    },
  },

  plugins: [
    forms,
  ],
}

