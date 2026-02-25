/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        lila: {
          accent: '#7C5CFF',
          surface: '#111111',
          surface2: '#121212',
          border: '#1E1E1E',
          text: '#FFFFFF',
          textMuted: '#8A8A8A',
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 400ms ease-out forwards',
        'shimmer': 'shimmer 1.5s infinite linear',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
};
