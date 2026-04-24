import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 대한민국 정부 상징 색상 기반
        gov: {
          navy: "#003A70",       // 정부 상징 네이비
          "navy-dark": "#002347",
          "navy-light": "#1B4A85",
          red: "#C8102E",        // 태극 빨강
          blue: "#0047A0",       // 태극 파랑
          gray: {
            50: "#F7F8FA",
            100: "#EEF0F4",
            200: "#DDE2EA",
            300: "#C0C7D4",
            400: "#8B94A5",
            500: "#5E6777",
            600: "#3F485A",
            700: "#2A3142",
            800: "#1A1F2E",
          },
        },
      },
      fontFamily: {
        sans: ["Pretendard", "Noto Sans KR", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        gov: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
