/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#161311',
        basalt: '#2d241e',
        'surface-container-low': '#1f1b19',
        'surface-container': '#231f1d',
        'surface-container-high': '#2e2927',
        'surface-container-highest': '#393431',
        'surface-bright': '#3d3836',
        xenonite: '#e2a76f',
        magma: '#b75d29',
        'on-surface': '#eae1dd',
        'on-surface-variant': '#dbc1b6',
        'outline-variant': '#55433a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}