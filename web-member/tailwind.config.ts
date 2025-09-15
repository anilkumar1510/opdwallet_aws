import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Brand colors (Calm Teal + Navy theme)
        brand: {
          DEFAULT: '#0F766E',
          600: '#0F766E',
          700: '#115E59',
          50: '#F0FDFA'
        },
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#64748B',
          300: '#CBD5E1'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F8FAFC',
          border: '#E5E7EB'
        },
        // Semantic colors
        success: {
          DEFAULT: '#22C55E',
          50: '#F0FDF4',
          700: '#15803D'
        },
        danger: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          700: '#B91C1C'
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          700: '#B45309'
        }
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px'
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['28px', '36px'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        'safe-area-bottom': 'env(safe-area-inset-bottom)',
        'safe-area-top': 'env(safe-area-inset-top)',
      },
      height: {
        'touch': '44px', // Minimum touch target
        'nav': '64px',   // Navigation height
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(2, 6, 23, 0.06)',
        'medium': '0 10px 40px rgba(2, 6, 23, 0.08)',
      },
      keyframes: {
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-down": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        shimmer: 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config