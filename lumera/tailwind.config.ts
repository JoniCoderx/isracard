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
        obsidian: "#0a0a0b",
        ink: "#101012",
        coal: "#17171a",
        smoke: "#1e1e22",
        ivory: "#f4f0e8",
        "ivory-dim": "#d8d3c7",
        platinum: "#c9c9ce",
        ash: "#8b8b92",
        graphite: "#5a5a61",
        champagne: "#c8a96a",
        "champagne-soft": "#d9c193",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Variable", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.28em",
        wide2: "0.4em",
      },
      fontSize: {
        "display-xl": ["clamp(4rem, 13vw, 13rem)", { lineHeight: "0.92", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(3rem, 9vw, 8.5rem)", { lineHeight: "0.95", letterSpacing: "-0.015em" }],
        "display-md": ["clamp(2.4rem, 6vw, 5.5rem)", { lineHeight: "1.0", letterSpacing: "-0.01em" }],
        "display-sm": ["clamp(1.9rem, 4vw, 3.4rem)", { lineHeight: "1.05" }],
      },
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.16, 1, 0.3, 1)",
        vault: "cubic-bezier(0.7, 0, 0.2, 1)",
      },
      maxWidth: {
        editorial: "1600px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        "grain-shift": {
          "0%,100%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(-2%,1%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 1.1s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
