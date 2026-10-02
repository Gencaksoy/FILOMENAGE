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
        navy: {
          50: "#f0f4f9",
          100: "#dbe4f0",
          200: "#b9cee3",
          300: "#8eb2d2",
          400: "#5c91be",
          500: "#3b75a6",
          600: "#2d5e89",
          700: "#254c70",
          800: "#1e3c59",
          900: "#0f2338",
          950: "#0a1726",
        },
        fleet: {
          blue: "#1a365d",
          dark: "#0b1523",
          card: "#ffffff",
          bg: "#f8fafc",
          accent: "#2563eb",
        }
      },
    },
  },
  plugins: [],
};
export default config;
