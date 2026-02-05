/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/messages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2fbf7",
          100: "#dff6ec",
          200: "#bfe9d8",
          300: "#9bdcc2",
          400: "#84c9ad", // your accent
          500: "#5db595",
          600: "#3e9b7d",
          700: "#2f7b64",
          800: "#245e4d",
          900: "#1b463a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
