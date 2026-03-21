/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        grid: {
          bg: '#0F1117',
          surface: '#13151F',
          card: '#1A1D27',
          border: '#2A2A28',
          divider: '#1E1E1C',
          clean: '#22C55E',
          moderate: '#EAB308',
          dirty: '#EF4444',
          info: '#3B8BD4',
        },
        text: {
          primary: '#D0D0CE',
          muted: '#888780',
          hint: '#444441',
          label: '#555553',
          body: '#666663',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
