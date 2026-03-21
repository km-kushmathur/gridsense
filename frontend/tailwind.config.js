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
          bg: '#050914',
          panel: 'rgba(10, 17, 30, 0.82)',
          border: 'rgba(148, 163, 184, 0.16)',
          mint: '#3ef2c8',
          amber: '#f9b24b',
        },
      },
      boxShadow: {
        'grid-panel': '0 20px 60px rgba(0, 0, 0, 0.32)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
