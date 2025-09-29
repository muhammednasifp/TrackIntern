/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark-matter': 'var(--dark-matter)',
        'cosmic-blue': 'var(--cosmic-blue)',
        'stellar-white': 'var(--stellar-white)',
        'nebula-purple': 'var(--nebula-purple)',
      },
      backgroundColor: {
        'glass-bg': 'var(--glass-bg)',
      },
      borderColor: {
        'glass-border': 'var(--glass-border)',
      }
    },
  },
  plugins: [],
};