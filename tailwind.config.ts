import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#effcf6",
          100: "#d1fae5",
          600: "#16845b",
          700: "#116b49",
        },
      },
    },
  },
  plugins: [],
};

export default config;
