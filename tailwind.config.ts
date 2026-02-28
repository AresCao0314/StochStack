import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-heading)', 'ui-sans-serif', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace']
      },
      colors: {
        base: 'var(--color-base)',
        ink: 'var(--color-ink)',
        accent1: 'var(--color-accent-1)',
        accent2: 'var(--color-accent-2)',
        accent3: 'var(--color-accent-3)',
        warm: 'var(--color-warm-gray)'
      },
      boxShadow: {
        card: '0 12px 30px rgba(11,15,20,0.08)'
      },
      gridTemplateColumns: {
        editorial: 'repeat(12, minmax(0, 1fr))'
      }
    }
  },
  plugins: []
};

export default config;
