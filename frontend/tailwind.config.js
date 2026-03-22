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
          bg: '#F8FAFC',
          surface: '#F1F5F9',
          card: '#FFFFFF',
          border: '#E2E8F0',
          divider: '#F1F5F9',
          clean: '#22C55E',
          moderate: '#EAB308',
          dirty: '#EF4444',
          info: '#3B8BD4',
        },
        text: {
          primary: '#1E293B',
          muted: '#475569',
          hint: '#94A3B8',
          label: '#64748B',
          body: '#334155',
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
