/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f0f0f",
        foreground: "#ffffff",
        primary: {
          DEFAULT: "#3b82f6",
          dark: "#2563eb",
        },
        sidebar: "#1a1a1a",
        toolbar: "#262626",
      },
      fontFamily: {
        'noto-sans': ['Noto Sans JP', 'sans-serif'],
        'noto-serif': ['Noto Serif JP', 'serif'],
        'yu-gothic': ['Yu Gothic', 'YuGothic', 'sans-serif'],
        'yu-mincho': ['Yu Mincho', 'YuMincho', 'serif'],
        'meiryo': ['Meiryo', 'sans-serif'],
        'm-plus': ['M PLUS 1p', 'sans-serif'],
        'zen-kaku': ['Zen 角ゴシック New', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
        'playfair': ['Playfair Display', 'serif'],
        'oswald': ['Oswald', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'jetbrains': ['JetBrains Mono', 'monospace'],
        'times': ['Times New Roman', 'serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.glass': {
          '@apply bg-white/5 backdrop-blur-md border border-white/10 shadow-xl': {},
        },
        '.glass-dark': {
          '@apply bg-black/40 backdrop-blur-xl border border-white/5 shadow-2xl': {},
        },
      })
    }
  ],
}
