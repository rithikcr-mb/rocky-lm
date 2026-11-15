/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#141312',
        surface: '#191816',
        'surface-raised': '#211f1c',
        'surface-high': '#2a2723',
        line: 'rgba(239, 233, 225, 0.09)',
        ink: '#efeae3',
        'ink-secondary': '#b3aaa0',
        'ink-muted': '#8b8278',
        ember: '#e08a4a',
        'ember-strong': '#c2652a',
        'ember-soft': '#f0c19a',
        positive: '#4cc38a',
        negative: '#e5484d',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        heading: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      transitionTimingFunction: {
        ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      boxShadow: {
        overlay: '0 24px 64px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
}
