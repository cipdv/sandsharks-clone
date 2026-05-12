/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        "sandsharks-cream": "#FBF3C1",
        "sandsharks-mint": "#64E2B7",
        "sandsharks-lilac": "#DC8BE0",
        "sandsharks-magenta": "#D50B8B",
        "sandsharks-ink": "#4D1244",
        "sandsharks-blue": "#D50B8B",
        blue: {
          50: "#FFF9D9",
          100: "#DDF8EB",
          200: "#BDF0DE",
          300: "#8DE9CA",
          400: "#64E2B7",
          500: "#D50B8B",
          600: "#B90978",
          700: "#8F075F",
          800: "#650546",
          900: "#4D1244",
        },
      },
    },
  },
  plugins: [],
};
