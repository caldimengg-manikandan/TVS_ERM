/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // TVS Enterprise Design System
        primary: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
          50: "#F0F4FF",
          100: "#E0E8FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#3730A3",
          800: "#2563EB",
          900: "#1E293B",
          950: "#0F172A",
        },
        secondary: {
          DEFAULT: "#334155",
          foreground: "#F1F5F9",
        },
        accent: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
          hover: "#1D4ED8",
        },
        success: {
          DEFAULT: "#16A34A",
          light: "#DCFCE7",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          foreground: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
          foreground: "#FFFFFF",
        },
        background: "#F8FAFC",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1E293B",
        },
        border: "#E2E8F0",
        input: "#E2E8F0",
        ring: "#2563EB",
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        // Status colors
        status: {
          available: "#16A34A",
          nearCapacity: "#F59E0B",
          overloaded: "#DC2626",
          active: "#2563EB",
          planning: "#8B5CF6",
          completed: "#16A34A",
          onHold: "#F59E0B",
          cancelled: "#DC2626",
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        'sidebar': '260px',
        'sidebar-collapsed': '64px',
        'header': '60px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'sidebar': '2px 0 8px rgba(0, 0, 0, 0.06)',
        'header': '0 1px 4px rgba(0, 0, 0, 0.08)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
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
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(100%)", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "counter-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-in",
        "fade-in": "fade-in 0.3s ease-out",
        "counter-up": "counter-up 0.5s ease-out",
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
