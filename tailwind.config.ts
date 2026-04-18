import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // AXIS design tokens
        bg: {
          base: "#1a1208",
          elevated: "#221508",
          surface: "#150e05",
          border: "#2e1e0e",
          'border-hover': "#3a2810",
        },
        brand: {
          orange: "#c95a2a",
          'orange-muted': "rgba(201,90,42,0.1)",
          'orange-border': "rgba(201,90,42,0.3)",
        },
        text: {
          cream: "#f5ede3",
          muted: "#7a6654",
          faint: "#4a3828",
        },
      },
      fontFamily: {
        barlow: ["'Barlow Condensed'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      screens: {
        '3xl': '1400px',
      },
    },
  },
  plugins: [],
};
export default config;
