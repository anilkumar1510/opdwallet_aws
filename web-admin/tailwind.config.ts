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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
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
        secondary: {
          DEFAULT: '#F7931E',
          500: '#F7931E',
          600: '#E8890B',
          700: '#D97706',
        },
        accent: {
          DEFAULT: '#F7931E',
          50: '#FEF5E7',
          100: '#FEEAC8',
          500: '#F7931E',
          600: '#E8890B',
        },
        destructive: {
          DEFAULT: '#EF4444',
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#111827',
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(30, 58, 140, 0.06)',
        'medium': '0 10px 40px rgba(30, 58, 140, 0.08)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config