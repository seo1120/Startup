/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FAF7ED',
        secondary: '#574519',
      },
      fontFamily: {
        sans: ['Afacad Flux', 'sans-serif'],
        serif: ['Gloock', 'serif'],
      },
      fontSize: {
        '32': '32px',
        '24': '24px',
        '20': '20px',
        '18': '18px',
        '16': '16px',
        '14': '14px',
      },
      fontWeight: {
        light: '300',
        regular: '400',
        bold: '700',
      },
    },
  },
  plugins: [],
}

