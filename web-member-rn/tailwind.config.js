/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand colors - Habit Healthcare (from web portal)
        brand: {
          DEFAULT: '#1E3A8C',
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
        // Accent colors - Orange
        accent: {
          DEFAULT: '#F7931E',
          50: '#FEF5E7',
          100: '#FEEAC8',
          200: '#FDD591',
          300: '#FCC05A',
          400: '#FBAB23',
          500: '#F7931E',
          600: '#E8890B',
          700: '#D97706',
          800: '#B45309',
          900: '#8F3E08',
        },
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#64748B',
          300: '#CBD5E1',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F8FAFC',
          border: '#E5E7EB',
        },
        success: {
          DEFAULT: '#22C55E',
          50: '#F0FDF4',
          700: '#15803D',
        },
        danger: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          700: '#B91C1C',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          700: '#B45309',
        },
        background: '#F7F7FC',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        heading: ['PlusJakartaSans', 'System'],
      },
    },
  },
  plugins: [],
};
