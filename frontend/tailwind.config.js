/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        farm: {
          50: '#f3f9ec', 100: '#e3f2d3', 200: '#c9e7ad', 300: '#a3d67d',
          400: '#7bbf4e', 500: '#5da32e', 600: '#478221', 700: '#39651c',
          800: '#30511a', 900: '#2a4518', 950: '#15230a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(21, 35, 10, 0.08)',
      },
    },
  },
  plugins: [],
};
