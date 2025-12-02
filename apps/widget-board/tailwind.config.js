/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        matrix: {
          base: '#0D0D0D',     // Deep black background
          crust: '#121212',    // Panel backgrounds
          primary: '#00FF41',  // Classic Matrix Green
          dim: '#008F11',      // Dimmed green
          glow: '#003B00',     // Glow effects
          alert: '#FF0000',    // Critical alert
          warning: '#FFB300',  // Warning
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['"Fira Code"', '"Source Code Pro"', 'monospace'],
      },
      boxShadow: {
        'matrix-glow': '0 0 15px rgba(0, 255, 65, 0.1)',
        'matrix-glow-intense': '0 0 20px rgba(0, 255, 65, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 5px #00FF41' },
          '100%': { textShadow: '0 0 20px #00FF41, 0 0 30px #00FF41' },
        }
      }
    },
  },
  plugins: [],
};