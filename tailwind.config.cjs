/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--page)', surface: 'var(--surface)', ink: 'var(--ink)', muted: 'var(--muted)',
        line: 'var(--line)', blush: 'var(--blush)', rose: 'var(--rose)', lilac: 'var(--lilac)',
        plum: 'var(--plum)', violet: 'var(--violet)',
        alta: 'var(--alta)', media: 'var(--media)', ok: 'var(--ok)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(74,32,96,.05), 0 6px 20px -8px rgba(74,32,96,.14)',
        lift: '0 2px 4px rgba(74,32,96,.06), 0 16px 40px -14px rgba(74,32,96,.28)',
      },
    },
  },
  plugins: [],
};
