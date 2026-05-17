/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        michigan: {
          blue: '#00274C',
          maize: '#FFCB05',
        },
        detroit: {
          slate: '#0f1419',
          panel: '#161b22',
          border: '#2d333b',
          muted: '#8b949e',
          accent: '#1f6feb',
          danger: '#f85149',
          warning: '#d29922',
          caution: '#e3b341',
          safe: '#3fb950',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Syne"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 8px 32px rgba(0, 0, 0, 0.45)',
        glow: '0 0 24px rgba(31, 111, 235, 0.25)',
      },
    },
  },
  plugins: [],
};
