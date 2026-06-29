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
        brand: {
          DEFAULT: '#5B4CF5',
          hover:   '#4A3DE0',
          light:   '#EDE9FF',
          50:      '#F5F3FF',
          100:     '#EDE9FF',
          200:     '#DDD6FE',
          300:     '#C4B5FD',
          400:     '#A78BFA',
          500:     '#7C6FF7',
          600:     '#5B4CF5',
          700:     '#4A3DE0',
          800:     '#3730A3',
          900:     '#312E81',
        },
        surface: {
          base:    '#F8F7FF',
          card:    '#FFFFFF',
          hover:   '#F0EFFF',
          active:  '#E8E6FF',
        },
        ink: {
          primary:   '#1A1635',
          secondary: '#4A4568',
          muted:     '#8B87A8',
        },
        border: {
          DEFAULT: '#E2DFFF',
          strong:  '#C5BFFF',
        },
      },
      fontFamily: {
        sans:     ['Inter', 'system-ui', 'sans-serif'],
        display:  ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card:   '16px',
        button: '10px',
        chip:   '999px',
      },
      boxShadow: {
        card:  '0 2px 12px rgba(91,76,245,0.08)',
        hover: '0 4px 20px rgba(91,76,245,0.12)',
        modal: '0 20px 60px rgba(91,76,245,0.15)',
      },
    },
  },
  plugins: [],
}
