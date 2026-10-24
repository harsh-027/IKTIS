/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#004e9f",
          container: "#0066cc",
          focus: "#0071e3",
          dark: "#2997ff",
        },
        ink: {
          DEFAULT: "#1d1d1f",
          muted: "#7a7a7a",
        },
        surface: {
          DEFAULT: "#fcf8fb",
          canvas: "#ffffff",
          soft: "#f5f5f7",
          pearl: "#fafafc",
          dim: "#dcd9dc",
          lowest: "#ffffff",
          low: "#f6f3f5",
          container: "#f0edef",
          high: "#eae7ea",
          highest: "#e4e2e4",
          dark: "#000000",
          tile: "#272729",
        },
        canvas: {
          DEFAULT: "#ffffff",
          soft: "#f5f5f7",
        },
        border: {
          DEFAULT: "#e0e0e0",
          divider: "#f0f0f0",
        },
        "badge-paid": {
          bg: "#ecfdf5",
          text: "#047857",
          border: "#a7f3d0",
        },
        "badge-partial": {
          bg: "#fffbeb",
          text: "#b45309",
          border: "#fde68a",
        },
        "badge-overdue": {
          bg: "#fff1f2",
          text: "#be123c",
          border: "#fecdd3",
        },
        "badge-unpaid": {
          bg: "#f1f5f9",
          text: "#334155",
          border: "#cbd5e1",
        },
        "badge-void": {
          bg: "#f3f4f6",
          text: "#6b7280",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "18px",
        utility: "8px",
      },
    },
  },
  plugins: [],
}
