export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: '#0f0f10',
        surface: '#18181b',
        card: '#1f1f23',
        border: '#2e2e35',
        accent: '#4ade80',
        'accent-dim': '#166534',
        muted: '#71717a',
        light: '#f4f4f5',
      },
    },
  },
};
