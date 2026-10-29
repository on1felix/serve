/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#15161a",
        panel: "#1b1d22",
        panel2: "#202329",
        line: "#2b2d35",
        line2: "#3a3d46",
        ink: "#e9eaee",
        muted: "#989ca6",
        dim: "#787c86",
        ok: "#3ddc84",
        warn: "#f5b544",
        bad: "#f26d6d",
        accent: "#8b7cf6",
      },
      fontFamily: {
        sans: [
          '"Segoe UI Variable Text"',
          '"Segoe UI Variable"',
          '"Segoe UI"',
          "system-ui",
          "sans-serif",
        ],
        mono: ['"Cascadia Code"', '"Consolas"', "monospace"],
      },
      boxShadow: {
        panel: "0 18px 50px -22px rgba(0,0,0,0.85)",
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 14px 34px -16px rgba(0,0,0,0.9)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(61,220,132,0.45)" },
          "70%": { boxShadow: "0 0 0 7px rgba(61,220,132,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(61,220,132,0)" },
        },
        "pulse-ring-accent": {
          "0%": { boxShadow: "0 0 0 0 rgba(139,124,246,0.5)" },
          "70%": { boxShadow: "0 0 0 7px rgba(139,124,246,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(139,124,246,0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "pulse-ring": "pulse-ring 2.2s ease-out infinite",
        "pulse-ring-accent": "pulse-ring-accent 2.2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
