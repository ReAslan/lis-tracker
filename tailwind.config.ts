import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        peach: "#fff0e7",
        coral: "#ff8fab",
        "coral-dark": "#f4708a",
        mint: "#b5e8d5",
        "mint-dark": "#8dd4b8",
        sky: "#b8d8ff",
        lavender: "#d4b8ff",
        sunny: "#ffe5a0",
        "text-warm": "#5c4b51",
        "text-soft": "#8b7b80",
        "text-light": "#b5a5aa",
      },
      opacity: {
        8: "0.08",
        12: "0.12",
        15: "0.15",
        35: "0.35",
        45: "0.45",
        55: "0.55",
        85: "0.85",
        88: "0.88",
      },
      fontFamily: {
        cute: ["var(--font-cute)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        blob: "1.5rem",
        pill: "3rem",
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "float-delayed": "float 3s ease-in-out 1s infinite",
        wiggle: "wiggle 0.3s ease-in-out",
        sparkle: "sparkle 1.5s ease-in-out infinite",
        bounce: "bounce 0.5s ease-out",
        pop: "pop 0.3s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-3deg)" },
          "75%": { transform: "rotate(3deg)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0", transform: "scale(0) rotate(0deg)" },
          "50%": { opacity: "1", transform: "scale(1) rotate(180deg)" },
        },
        pop: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
