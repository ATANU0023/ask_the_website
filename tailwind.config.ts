import type { Config } from "tailwindcss"
const {nextui} = require("@nextui-org/react");


const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        "sans": ["Inter", "system-ui", "sans-serif"],
        "geist": ["Geist", "sans-serif"],
        "headline-lg": ["Geist", "sans-serif"],
        "code-sm": ["Geist", "monospace"],
        "body-md": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "label-md": ["Geist", "sans-serif"],
        "headline-xl": ["Geist", "sans-serif"]
      },
      fontSize: {
        "headline-lg": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.015em", "fontWeight": "600"}],
        "code-sm": ["13px", {"lineHeight": "18px", "fontWeight": "400"}],
        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500"}],
        "headline-xl": ["36px", {"lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "600"}]
      },
      spacing: {
        "gutter": "24px",
        "margin-desktop": "32px",
        "container-max": "1440px",
        "margin-mobile": "16px",
        "header-height": "64px",
        "sidebar-width": "280px",
        "stack-gap": "12px"
      },
      colors: {
        "border": "#424351",
        "input": "#424351",
        "ring": "#c0c1ff",
        "foreground": "#e3e1ec",
        "popover": "#12131a",
        "popover-foreground": "#e3e1ec",
        "muted": "#1e1f26",
        "muted-foreground": "#92929e",
        "destructive": "#ffb4ab",
        "destructive-foreground": "#690005",
        "success-glow": "#c0c1ff33",
        "error": "#ffb4ab",
        "outline-variant": "#46464f",
        "on-error": "#690005",
        "on-secondary-container": "#b7b4b8",
        "secondary-fixed": "#e5e1e5",
        "background": "#12131a",
        "secondary": "#c8c5c9",
        "primary-container": "#c0c1ff",
        "surface-tint": "#c0c1ff",
        "on-secondary-fixed": "#1c1b1e",
        "surface-dim": "#12131a",
        "secondary-container": "#474649",
        "on-background": "#e3e1ec",
        "on-error-container": "#ffdad6",
        "inverse-primary": "#585990",
        "surface-glass": "rgba(30, 31, 38, 0.6)",
        "error-container": "#93000a",
        "surface-variant": "#34343c",
        "tertiary": "#e4e1e6",
        "surface-bright": "#383941",
        "primary": "#e1dfff",
        "on-secondary-fixed-variant": "#474649",
        "surface": "#12131a",
        "on-tertiary": "#313034",
        "on-primary-fixed": "#131449",
        "on-tertiary-fixed-variant": "#47464a",
        "on-surface-variant": "#c7c5d0",
        "on-secondary": "#313033",
        "on-primary-fixed-variant": "#404176",
        "on-surface": "#e3e1ec",
        "primary-fixed": "#e1e0ff",
        "outline-muted": "rgba(70, 69, 84, 0.4)",
        "on-primary-container": "#4b4d83",
        "secondary-fixed-dim": "#c8c5c9",
        "outline": "#918f9a",
        "surface-container": "#1e1f26",
        "inverse-on-surface": "#2f3038",
        "tertiary-fixed-dim": "#c8c5ca",
        "tertiary-fixed": "#e5e1e6",
        "surface-container-lowest": "#0d0e15",
        "on-tertiary-fixed": "#1c1b1f",
        "surface-container-highest": "#34343c",
        "on-tertiary-container": "#535256",
        "on-primary": "#292b5e",
        "primary-fixed-dim": "#c0c1ff",
        "surface-container-high": "#292931",
        "inverse-surface": "#e3e1ec",
        "tertiary-container": "#c8c5ca",
        "surface-container-low": "#1a1b22"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
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
        "flip": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
        "flip-back": {
          "0%": { transform: "rotateY(180deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), nextui()],
} satisfies Config

export default config