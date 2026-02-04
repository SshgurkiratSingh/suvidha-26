/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0A3D62",
          hover: "#083451",
        },
        secondary: {
          DEFAULT: "#138808",
          hover: "#0F6906",
        },
        accent: {
          DEFAULT: "#FF9933",
          hover: "#E68A2E",
        },
        neutral: "#F7F9FB",
        success: "#4CAF50",
        warning: "#FFA726",
        danger: "#D32F2F",
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "Noto Sans", "sans-serif"],
        heading: ["Poppins", "Inter", "sans-serif"],
      },
    },
  },
  filters: {
    none: 'none',
    grayscale: 'grayscale(1)',
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
