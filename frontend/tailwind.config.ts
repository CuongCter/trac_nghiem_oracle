import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  darkMode: "media",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "24px",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
        "2xl": "1536px",
      },
    },
    extend: {
      colors: {
        // Neutral
        "neutral-primary-soft": "var(--color-neutral-primary-soft)",
        "neutral-primary": "var(--color-neutral-primary)",
        "neutral-primary-medium": "var(--color-neutral-primary-medium)",
        "neutral-primary-strong": "var(--color-neutral-primary-strong)",
        "neutral-secondary-soft": "var(--color-neutral-secondary-soft)",
        "neutral-secondary": "var(--color-neutral-secondary)",
        "neutral-secondary-medium": "var(--color-neutral-secondary-medium)",
        "neutral-tertiary-soft": "var(--color-neutral-tertiary-soft)",
        "neutral-tertiary": "var(--color-neutral-tertiary)",
        "neutral-tertiary-medium": "var(--color-neutral-tertiary-medium)",
        "neutral-quaternary": "var(--color-neutral-quaternary)",
        quaternary: "var(--color-quaternary-medium)",
        gray: "var(--color-gray)",

        // Brand
        "brand-softer": "var(--color-brand-softer)",
        "brand-soft": "var(--color-brand-soft)",
        brand: "var(--color-brand)",
        "brand-medium": "var(--color-brand-medium)",
        "brand-strong": "var(--color-brand-strong)",

        // Status
        "success-soft": "var(--color-success-soft)",
        success: "var(--color-success)",
        "success-medium": "var(--color-success-medium)",
        "success-strong": "var(--color-success-strong)",
        "danger-soft": "var(--color-danger-soft)",
        danger: "var(--color-danger)",
        "danger-medium": "var(--color-danger-medium)",
        "danger-strong": "var(--color-danger-strong)",
        "warning-soft": "var(--color-warning-soft)",
        warning: "var(--color-warning)",
        "warning-medium": "var(--color-warning-medium)",
        "warning-strong": "var(--color-warning-strong)",

        // Utility
        dark: "var(--color-dark)",
        "dark-strong": "var(--color-dark-strong)",
        disabled: "var(--color-disabled)",

        // Accent
        purple: "var(--color-purple)",
        sky: "var(--color-sky)",
        teal: "var(--color-teal)",
        pink: "var(--color-pink)",
        cyan: "var(--color-cyan)",
        fuchsia: "var(--color-fuchsia)",
        indigo: "var(--color-indigo)",
        orange: "var(--color-orange)",

        // Text
        "fg-white": "var(--color-white)",
        "fg-black": "var(--color-black)",
        heading: "var(--color-heading)",
        body: "var(--color-body)",
        "body-subtle": "var(--color-body-subtle)",
        "fg-brand": "var(--color-fg-brand)",
        "fg-brand-strong": "var(--color-fg-brand-strong)",
        "fg-success": "var(--color-fg-success)",
        "fg-success-strong": "var(--color-fg-success-strong)",
        "fg-danger": "var(--color-fg-danger)",
        "fg-danger-strong": "var(--color-fg-danger-strong)",
        "fg-warning": "var(--color-fg-warning)",
        "fg-disabled": "var(--color-fg-disabled)",

        // Border
        "border-dark": "var(--color-border-dark)",
        "border-buffer": "var(--color-border-buffer)",
        "border-default": "var(--color-border-default)",
        "border-default-medium": "var(--color-border-default-medium)",
        "border-default-strong": "var(--color-border-default-strong)",
        "border-default-subtle": "var(--color-border-default-subtle)",
        "border-light": "var(--color-border-light)",
        "border-light-medium": "var(--color-border-light-medium)",
        "border-success": "var(--color-border-success)",
        "border-success-subtle": "var(--color-border-success-subtle)",
        "border-danger": "var(--color-border-danger)",
        "border-danger-subtle": "var(--color-border-danger-subtle)",
        "border-warning": "var(--color-border-warning)",
        "border-warning-subtle": "var(--color-border-warning-subtle)",
        "border-brand": "var(--color-border-brand)",
        "border-brand-subtle": "var(--color-border-brand-subtle)",
        "border-brand-light": "var(--color-border-brand-light)",
      },
      fontFamily: {
        handrawn: ['"Delicious Handrawn"', "cursive"],
        sans: ['"Elms Sans"', "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-1": ["72px", { lineHeight: "1.05", letterSpacing: "-0.5px" }],
        "display-2": ["52px", { lineHeight: "1.1", letterSpacing: "-0.3px" }],
        "display-3": ["40px", { lineHeight: "1.15" }],
        "display-4": ["32px", { lineHeight: "1.2" }],
        "display-5": ["26px", { lineHeight: "1.3" }],
        "display-6": ["22px", { lineHeight: "1.35" }],
        "leading": ["20px", { lineHeight: "1.7" }],
        "body": ["16px", { lineHeight: "1.7" }],
        "small": ["14px", { lineHeight: "1.6" }],
        "tiny": ["12px", { lineHeight: "1.5" }],
      },
      borderRadius: {
        none: "0",
        sm: "8px",
        DEFAULT: "16px",
        md: "16px",
        lg: "24px",
        card: "24px",
        xl: "24px",
        control: "16px",
        "2xl": "32px",
        pill: "999px",
        full: "999px",
      },
      borderWidth: {
        DEFAULT: "2px",
        0: "0",
        1: "1px",
        2: "2px",
        3: "3px",
        4: "4px",
      },
      boxShadow: {
        "pencil-2xs": "var(--shadow-2xs)",
        "pencil-xs": "var(--shadow-xs)",
        "pencil-sm": "var(--shadow-sm)",
        "pencil-md": "var(--shadow-md)",
        "pencil-lg": "var(--shadow-lg)",
        "pencil-xl": "var(--shadow-xl)",
        "pencil-2xl": "var(--shadow-2xl)",
        "card-handdrawn":
          "0 0 0 4px var(--color-neutral-primary-medium), 2px 2px 4px 2px rgba(0, 0, 0, 0.5)",
      },
      spacing: {
        18: "4.5rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "scale-in": "scale-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
