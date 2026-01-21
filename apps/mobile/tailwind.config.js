/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary: "Groundwork Blue" - Sophisticated warm navy
        primary: {
          DEFAULT: "#3080D8",
          50: "#F0F7FE",
          100: "#E0EEFC",
          200: "#B8D7F5",
          300: "#89BAED",
          400: "#5A9DE4",
          500: "#3080D8",
          600: "#2666B5",
          700: "#1E4F8E",
          800: "#163B6A",
          900: "#0F2847",
          950: "#0A1628",
        },
        // Secondary: "Growth Green" - Rich botanical green
        secondary: {
          DEFAULT: "#22C772",
          50: "#EFFDF5",
          100: "#DCFAE9",
          200: "#B0F2CD",
          300: "#7EE6AD",
          400: "#4DD98F",
          500: "#22C772",
          600: "#1AA35C",
          700: "#15854B",
          800: "#116638",
          900: "#0A4725",
        },
        // Accent: "Amber Reward" - Warm golden amber
        accent: {
          DEFAULT: "#F59315",
          50: "#FFFAF0",
          100: "#FEF0D9",
          200: "#FCDEAD",
          300: "#FAC67A",
          400: "#F7AC47",
          500: "#F59315",
          600: "#D07A0D",
          700: "#AC5F0B",
          800: "#854808",
          900: "#5C3206",
        },
        // Bucket Colors - The Four Pillars
        bucket: {
          spend: {
            DEFAULT: "#F06050",
            50: "#FEF5F4",
            100: "#FEE7E5",
            200: "#FDCFCB",
            300: "#F9A9A0",
            400: "#F48175",
            500: "#F06050",
            600: "#D94538",
            700: "#B53028",
            800: "#8C241F",
            900: "#631A16",
          },
          save: {
            DEFAULT: "#38BDF8",
            50: "#F0FAFF",
            100: "#E0F5FF",
            200: "#B8E9FE",
            300: "#7CD8FC",
            400: "#38BDF8",
            500: "#0EA5E9",
            600: "#0284C7",
            700: "#0369A1",
            800: "#075985",
            900: "#0C4A6E",
          },
          give: {
            DEFAULT: "#A78BFA",
            50: "#FAF8FF",
            100: "#F3EFFF",
            200: "#E9E0FF",
            300: "#D4C4FE",
            400: "#B89CFB",
            500: "#A78BFA",
            600: "#8B5CF6",
            700: "#7C3AED",
            800: "#6D28D9",
            900: "#5B21B6",
          },
          invest: {
            DEFAULT: "#84CC16",
            50: "#F7FEE7",
            100: "#ECFCCB",
            200: "#D9F99D",
            300: "#BEF264",
            400: "#A3E635",
            500: "#84CC16",
            600: "#65A30D",
            700: "#4D7C0F",
            800: "#3F6212",
            900: "#365314",
          },
        },
        // Neutral: "Foundation Slate" - Warm slate with slight blue undertone
        slate: {
          0: "#FFFFFF",
          50: "#F6F7F8",
          100: "#ECEEF0",
          200: "#D8DDE2",
          300: "#B8C1C9",
          400: "#94A0AB",
          500: "#6F7E8A",
          600: "#52616E",
          700: "#384452",
          800: "#232D38",
          900: "#151C24",
          950: "#0C1117",
        },
        // Semantic colors
        surface: "#FFFFFF",
        background: "#F6F7F8",
        text: {
          DEFAULT: "#151C24",
          muted: "#6F7E8A",
        },
        // Trust Score tiers
        trust: {
          excellent: "#F59315", // Amber
          strong: "#22C772", // Green
          growing: "#38BDF8", // Sky Blue
          building: "#6F7E8A", // Slate
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "monospace"],
      },
      fontSize: {
        // Type Scale
        display: ["40px", { lineHeight: "48px", fontWeight: "700" }],
        h1: ["32px", { lineHeight: "40px", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "32px", fontWeight: "600" }],
        h3: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "500" }],
        overline: ["11px", { lineHeight: "16px", fontWeight: "600", letterSpacing: "0.05em" }],
        // Money Display
        "money-lg": ["48px", { lineHeight: "56px", fontWeight: "600" }],
        "money-md": ["32px", { lineHeight: "40px", fontWeight: "600" }],
        "money-sm": ["20px", { lineHeight: "28px", fontWeight: "500" }],
        "trust-score": ["64px", { lineHeight: "72px", fontWeight: "700" }],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      boxShadow: {
        // Elevation System
        "elevation-1": "0 1px 2px rgba(12, 17, 23, 0.05)",
        "elevation-2": "0 4px 12px rgba(12, 17, 23, 0.08)",
        "elevation-3": "0 8px 24px rgba(12, 17, 23, 0.12)",
        "elevation-4": "0 16px 48px rgba(12, 17, 23, 0.16)",
      },
      spacing: {
        18: "72px",
        22: "88px",
      },
    },
  },
  plugins: [],
};
