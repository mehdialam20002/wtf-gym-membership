/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#39FF14',
          cyan: '#00FFFF',
          yellow: '#FFE600',
        },
        dark: {
          900: '#050508',
          800: '#0a0a0f',
          700: '#0f0f1a',
          600: '#141425',
          500: '#1a1a30',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-neon': 'linear-gradient(135deg, #39FF14 0%, #00FFFF 100%)',
        'gradient-dark': 'linear-gradient(180deg, #050508 0%, #0a0a1a 100%)',
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 5px #39FF14, 0 0 10px #39FF14, 0 0 20px #39FF14' },
          '50%': { boxShadow: '0 0 10px #39FF14, 0 0 25px #39FF14, 0 0 50px #39FF14' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          from: { textShadow: '0 0 10px #39FF14, 0 0 20px #39FF14' },
          to: { textShadow: '0 0 20px #39FF14, 0 0 40px #39FF14, 0 0 60px #39FF14' },
        },
      },
      boxShadow: {
        'neon-green': '0 0 5px #39FF14, 0 0 20px #39FF14, 0 0 40px rgba(57,255,20,0.3)',
        'neon-cyan': '0 0 5px #00FFFF, 0 0 20px #00FFFF, 0 0 40px rgba(0,255,255,0.3)',
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      });
    },
  ],
};
