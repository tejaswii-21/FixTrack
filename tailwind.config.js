/** @type {import('tailwindcss').Config} */
// FixTrack Tailwind theme.
// - "navy"   -> primary navigation / sidebar background (#1e3a5f)
// - "royal"  -> primary actions / buttons / active elements (#2563eb)
// - cyan accents use Tailwind's built-in `cyan` scale (e.g. cyan-500)
// - Status colors use built-in scales: green=resolved, amber=pending, red=critical/overdue
export default {
  darkMode: 'class', // controlled by adding/removing the "dark" class on <html>
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1e3a5f',
          light: '#2a4d7a',
          dark: '#15293f',
        },
        royal: {
          DEFAULT: '#2563eb',
          light: '#3b82f6',
          dark: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}
