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
        ink: "#17202A",
        ocean: "#1D4ED8",
        mint: "#0E9F6E",
        coral: "#F59E0B",
        paper: "#F4F8FF",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(30, 64, 175, 0.09)",
      },
    },
  },
  plugins: [],
};

export default config;
