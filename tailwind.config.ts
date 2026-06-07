import type { Config } from "tailwindcss"

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-main)",
        foreground: "var(--text-main)",
        muted: "var(--text-muted)",
        border: "var(--border-soft)",
        card: "var(--surface)",
        brand: "var(--accent)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        "surface-glass": "var(--surface-glass)",
        "text-soft": "var(--text-soft)",
        "border-medium": "var(--border-medium)",
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        info: "#2563EB"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem"
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        float: "var(--shadow-float)"
      }
    }
  },
  plugins: []
} satisfies Config
