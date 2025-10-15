module.exports = {
  content: ["./src/**/*.{html,njk,md,js}"],
  theme: {
    extend: {
      colors: {
        bg: "#f5e7cf",
        surface: "#ffffff",
        primary: "#1f4d7a",
        secondary: "#f4b41b",
        accent: "#c83b59"
      },
      fontFamily: {
        sans: ["Source Sans 3","ui-sans-serif","system-ui","Segoe UI","Roboto","Helvetica","Arial","sans-serif"],
        heading: ["League Spartan","ui-sans-serif","system-ui","Segoe UI","Roboto","Helvetica","Arial","sans-serif"]
      },
      borderRadius: {
        '2xl': '1rem'
      }
    }
  },
  plugins: []
};
