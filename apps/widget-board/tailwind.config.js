/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-black': '#0a0a0f',
        'cyber-dark': '#0d1117',
        'cyber-gray': '#161b22',
        'neon-green': '#00ff41',
        'neon-cyan': '#00d4ff',
        'neon-purple': '#a855f7',
        'alert-red': '#ff0040',
        'alert-yellow': '#ffcc00',
        'matrix-green': '#003b00',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 2s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'typing': 'typing 3.5s steps(40, end)',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '100%': { boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
      },
      boxShadow: {
        'neon': '0 0 5px theme(colors.neon-green), 0 0 20px theme(colors.neon-green)',
        'neon-cyan': '0 0 5px theme(colors.neon-cyan), 0 0 20px theme(colors.neon-cyan)',
        'neon-red': '0 0 5px theme(colors.alert-red), 0 0 20px theme(colors.alert-red)',
      },
    },
  },
  plugins: [],
};
