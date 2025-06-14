/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        'lavender-200': 'rgba(80, 48, 229, 0.2)',
        'lavender-300': '#8B5CF6',
        'lavender-500': '#7B61FF',
        'lavender-700': '#5030E5',
        'lavender-800': '#4020D5'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
