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
          DEFAULT: "#06111c",
          container: "#1b2632",
          focus: "#1b2632",
          dark: "#506073",
        },
        secondary: "#506073",
        "secondary-container": "#d1e1f8",
        "on-secondary-container": "#556477",
        tertiary: "#1c0c00",
        "tertiary-fixed": "#ffdcbf",
        "tertiary-fixed-dim": "#ffb872",
        "on-tertiary-container": "#c17d33",
        ink: {
          DEFAULT: "#1d1c16",
          muted: "#44474b",
        },
        surface: {
          DEFAULT: "#fef9ef",
          canvas: "#ffffff",
          soft: "#f8f3e9",
          pearl: "#fef9ef",
          dim: "#dedad0",
          lowest: "#ffffff",
          low: "#f8f3e9",
          container: "#f2ede3",
          high: "#ede8de",
          highest: "#e7e2d8",
          dark: "#06111c",
          tile: "#1b2632",
        },
        canvas: {
          DEFAULT: "#ffffff",
          soft: "#f8f3e9",
        },
        border: {
          DEFAULT: "#c4c6cc",
          divider: "#e7e2d8",
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
          "DM Sans",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "system-ui",
          "sans-serif",
        ],
        display: ["Comfortaa", "DM Sans", "sans-serif"],
        label: ["Outfit", "DM Sans", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
        utility: "8px",
      },
    },
  },
  plugins: [],
}
