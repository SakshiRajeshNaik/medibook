/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          50: "#faf9f6",
          100: "#f5f3ed",
          200: "#e8e6df",
        },
        primary: {
          50: "#f0f7f2",
          100: "#dceee2",
          200: "#b8dcc4",
          300: "#8fc4a4",
          400: "#5fa67c",
          500: "#3d8b5f",
          600: "#2f704c",
          700: "#265a3d",
          800: "#204a33",
        },
        accent: {
          50: "#f4f9f5",
          100: "#e3f0e6",
          500: "#4a9b6a",
          600: "#3d8258",
        },
        brand: {
          ink: "#3d4540",
          soft: "#6b756e",
          cream: "#faf9f6",
        },
      },
      boxShadow: {
        soft: "0 4px 20px -4px rgba(47, 112, 76, 0.08)",
        card: "0 2px 12px -4px rgba(61, 69, 64, 0.1)",
        glow: "0 0 0 1px rgba(61, 139, 95, 0.12), 0 8px 24px -8px rgba(61, 139, 95, 0.18)",
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(at 30% 20%, rgba(184, 220, 196, 0.5) 0px, transparent 50%), radial-gradient(at 80% 40%, rgba(220, 238, 225, 0.6) 0px, transparent 55%)",
      },
    },
  },
  plugins: [],
};
