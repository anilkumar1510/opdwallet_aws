import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2F9',
          100: '#D4E1F5',
          200: '#A9C2EB',
          300: '#7EA4E1',
          400: '#5385D7',
          500: '#2867CD',
          600: '#1E3A8C',
          700: '#172B6A',
          800: '#101C47',
          900: '#0A0E25',
        },
        accent: {
          DEFAULT: '#F7931E',
          500: '#F7931E',
          600: '#E8890B',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(30, 58, 140, 0.06)',
        'medium': '0 10px 40px rgba(30, 58, 140, 0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
