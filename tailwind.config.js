/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#1a6b3c',
          50: '#f0faf4',
          100: '#dcf2e6',
          200: '#b8e4cc',
          300: '#7fcca7',
          400: '#44ae7c',
          500: '#1a6b3c',
          600: '#145530',
          700: '#0f3d22',
          800: '#0a2917',
          900: '#06150c',
        },
        gold: {
          DEFAULT: '#c9a84c',
          50: '#fdf8ec',
          100: '#f9edc9',
          200: '#f2d98e',
          300: '#e8c96a',
          400: '#d4b050',
          500: '#c9a84c',
          600: '#a8862e',
          700: '#8a6d25',
          800: '#6b531b',
          900: '#4d3c12',
        },
        ivory: '#f8f6f0',
      },
      backgroundImage: {
        'islamic-gradient': 'linear-gradient(135deg, #1a6b3c 0%, #0f4a28 100%)',
        'gold-gradient': 'linear-gradient(135deg, #c9a84c 0%, #a8862e 100%)',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.1)',
        'green': '0 4px 12px rgba(26,107,60,0.3)',
        'gold': '0 4px 12px rgba(201,168,76,0.3)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};