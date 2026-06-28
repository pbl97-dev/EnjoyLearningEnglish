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
        ocean: "#2563EB",
        mint: "#0E9F6E",
        coral: "#F97316",
        paper: "#F7FAFC",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(20, 33, 61, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
