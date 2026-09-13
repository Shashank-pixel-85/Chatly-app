/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Manrope'", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          50: "#f5f6fa",
          100: "#e9ebf3",
          200: "#cdd1e3",
          300: "#a3aac8",
          400: "#7079a6",
          500: "#4f5786",
          600: "#3a4069",
          700: "#2c3154",
          800: "#1e2140",
          900: "#14162c",
          950: "#0b0c1c",
        },
        accent: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#bccfff",
          300: "#8faeff",
          400: "#5c86ff",
          500: "#3b63f5",
          600: "#2946d9",
          700: "#2338af",
          800: "#21308c",
          900: "#212e6f",
        },
        coral: {
          400: "#ff8b7b",
          500: "#ff6b53",
          600: "#ec4f36",
        },
      },
      boxShadow: {
        panel: "0 1px 2px rgba(11,12,28,0.04), 0 8px 24px -12px rgba(11,12,28,0.15)",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        blink: {
          "0%, 80%, 100%": { opacity: "0.2" },
          "40%": { opacity: "1" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.15s ease-out",
        "slide-up": "slide-up 0.2s ease-out",
        blink: "blink 1.4s infinite both",
      },
    },
  },
  plugins: [],
};
