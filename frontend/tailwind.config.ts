import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        nova: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#bbd8ff",
          300: "#8cc1ff",
          400: "#559fff",
          500: "#2e7aff",
          600: "#1a5ef5",
          700: "#1249e1",
          800: "#153db6",
          900: "#17378f",
          950: "#122357",
        },
      },
    },
  },
  plugins: [],
};

export default config;
