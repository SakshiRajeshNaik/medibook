/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      colors: {
        surface: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0" },
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        accent: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
        },
        brand: {
          navy: "#0f172a",
          mist: "#e0f2fe",
        },
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 8px -2px rgba(15, 23, 42, 0.06)",
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px -8px rgba(15, 23, 42, 0.1)",
        glow: "0 0 0 1px rgba(37, 99, 235, 0.12), 0 12px 40px -12px rgba(37, 99, 235, 0.25)",
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(at 20% 30%, rgba(56, 189, 248, 0.35) 0px, transparent 50%), radial-gradient(at 80% 20%, rgba(99, 102, 241, 0.25) 0px, transparent 45%), radial-gradient(at 50% 80%, rgba(20, 184, 166, 0.2) 0px, transparent 50%)",
        "card-shine": "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%)",
      },
      animation: {
        float: "float 8s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
