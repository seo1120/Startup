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
        primary: {
          DEFAULT: '#423514',
        },
        background: {
          DEFAULT: '#F5F2E7',
        },
        wood: {
          light: '#c5d0b8',
          DEFAULT: '#a8b89a',
        },
        fire: {
          light: '#e6c19a',
          DEFAULT: '#d4a574',
        },
        earth: {
          light: '#d4c4a8',
          DEFAULT: '#b8a082',
        },
        metal: {
          light: '#bdbdbd',
          DEFAULT: '#9e9e9e',
        },
        water: {
          light: '#a8b89a',
          DEFAULT: '#8b9a7a',
        },
      },
      fontFamily: {
        gloock: ['Gloock', 'serif'],
        afacad: ['Afacad Flux', 'sans-serif'],
      },
      fontSize: {
        'gloock-sm': '17px',
        'gloock-base': '20px',
        'afacad-sm': '16px',
        'afacad-base': '18px',
        'afacad-lg': '20px',
      },
      borderRadius: {
        'design': '20px',
        'design-md': '16px',
        'design-sm': '12px',
      },
    },
  },
  plugins: [],
};

