/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: '#E74C3C',
          50: '#FCE8E6',
          100: '#F9D1CD',
          200: '#F3A39B',
          300: '#ED7569',
          400: '#E74C3C',
          500: '#D43628',
          600: '#A92B20',
          700: '#7E2018',
          800: '#531510',
          900: '#280A08',
        },
        secondary: {
          DEFAULT: '#3498DB',
          50: '#E8F4FC',
          100: '#D1E9F9',
          200: '#A3D3F3',
          300: '#75BDED',
          400: '#3498DB',
          500: '#2980B9',
          600: '#216694',
          700: '#194C6F',
          800: '#11334A',
          900: '#081925',
        },
        success: {
          DEFAULT: '#27AE60',
          50: '#E7F6ED',
          100: '#CFEDDB',
          200: '#9FDBB7',
          300: '#6FC993',
          400: '#27AE60',
          500: '#229A55',
          600: '#1B7B44',
          700: '#145C33',
          800: '#0D3D22',
          900: '#061E11',
        },
        warning: {
          DEFAULT: '#F39C12',
          50: '#FEF5E7',
          100: '#FDEBCF',
          200: '#FBD79F',
          300: '#F9C36F',
          400: '#F39C12',
          500: '#D68910',
          600: '#AB6E0D',
          700: '#80520A',
          800: '#553707',
          900: '#2A1B03',
        },
        // Neutral grays
        neutral: {
          DEFAULT: '#95A5A6',
          50: '#F7F8F8',
          100: '#EFF1F1',
          200: '#DFE3E3',
          300: '#CFD5D5',
          400: '#BFC7C7',
          500: '#95A5A6',
          600: '#778485',
          700: '#596364',
          800: '#3B4243',
          900: '#1D2121',
        },
      },
      fontFamily: {
        display: ['Fredoka One', 'cursive'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.4' }],
        sm: ['0.875rem', { lineHeight: '1.4' }],
        base: ['1rem', { lineHeight: '1.5' }],
        lg: ['1.125rem', { lineHeight: '1.5' }],
        xl: ['1.25rem', { lineHeight: '1.2' }],
        '2xl': ['1.5rem', { lineHeight: '1.2' }],
        '3xl': ['2rem', { lineHeight: '1.2' }],
        '4xl': ['2.5rem', { lineHeight: '1.2' }],
      },
      spacing: {
        xs: '0.25rem', // 4px
        sm: '0.5rem', // 8px
        md: '1rem', // 16px
        lg: '1.5rem', // 24px
        xl: '2rem', // 32px
        '2xl': '3rem', // 48px
        '3xl': '4rem', // 64px
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        card: '0 2px 4px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
};
