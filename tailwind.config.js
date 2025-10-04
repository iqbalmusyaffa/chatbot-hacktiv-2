/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}", "./public/**/*.{html,js}", "./src/**/*.{html,js}"],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(5px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-in-out",
      },
    },
  },
  plugins: [],
};
