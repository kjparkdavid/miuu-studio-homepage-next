/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-body)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        // Miuu Note brand, taken from the app's own UI
        ink: "#2B2240",
        violet: {
          DEFAULT: "#6A1CF6",
          deep: "#4A12B8",
          soft: "#A77EFF",
        },
        lilac: "#EFE9FF",
        canvas: "#FAF8FF",
        blush: "#FFE9F1",
        mint: "#D7F5E4",
        sky: "#DCEBFF",
        night: "#1B1838",
        // legacy colors kept for the privacy / paceon pages
        purple: "#7e52ff",
        smoothRed: "#FDD2D2",
      },
      boxShadow: {
        phone: "0 30px 60px -20px rgba(43, 34, 64, 0.35), 0 10px 20px -10px rgba(43, 34, 64, 0.2)",
        card: "0 1px 0 rgba(43, 34, 64, 0.04), 0 12px 32px -16px rgba(43, 34, 64, 0.18)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.92)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        "float-slow": "float 7s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        twinkle: "twinkle 3s ease-in-out infinite",
        // page-load entrances; pair with an [animation-delay:…] to stagger
        "fade-up": "fade-up 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both",
        "pop-in": "pop-in 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both",
      },
    },
  },
  plugins: [],
};
