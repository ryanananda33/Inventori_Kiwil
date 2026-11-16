/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary — Oranye cerah (aksen utama)
        primary: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // orange-500 — warna utama
          600: '#ea580c', // orange-600 — hover
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Secondary — Kuning hangat (aksen badge & grafik)
        amber: {
          50:  '#fffbeb',
          100: '#fef9c3', // soft yellow bg
          200: '#fde68a',
          300: '#fcd34d',
          400: '#facc15', // amber-400 — badge, ikon highlight
          500: '#eab308',
          600: '#ca8a04',
        },
        // Background & text
        slate: {
          50:  '#f8fafc', // main bg
          800: '#1e293b', // dark text
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
