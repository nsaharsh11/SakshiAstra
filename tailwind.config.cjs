/* =====================================================================
   tailwind.config.js — token map
   ---------------------------------------------------------------------
   The prototype ships on plain CSS variables (see tokens.css) and needs
   no build step. This config mirrors those tokens 1:1 so the same theme
   is available if the target codebase uses Tailwind. Values here must
   stay in sync with tokens.css — that file is the source of truth.
   ===================================================================== */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F7F8FA',
        surface: { DEFAULT: '#FFFFFF', alt: '#F1F5F9' },
        border: { DEFAULT: '#E3E6EB', strong: '#CBD5E1' },
        text: { DEFAULT: '#0F172A', 2: '#475569', 3: '#64748B' },
        accent: {
          DEFAULT: '#1E3A8A', hover: '#16306F',
          tint: '#EEF2FA', border: '#C7D2E8',
        },
        // the only colours in the product
        verdict: {
          assert: '#15803D', 'assert-bg': '#E7F4EC',
          hold: '#B45309', 'hold-bg': '#FBF0E2',
          reject: '#B91C1C', 'reject-bg': '#FBEBEB',
          takeover: '#B45309',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        body: ['1rem', { lineHeight: '1.5' }],
        label: ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.04em' }],
        card: ['1.25rem', { lineHeight: '1.25' }],
        page: ['1.75rem', { lineHeight: '1.25' }],
        counter: ['2.25rem', { lineHeight: '1.1' }],
        badge: ['0.875rem', { lineHeight: '1.5' }],
        nav: ['0.9375rem', { lineHeight: '1.5' }],
        cover: ['3rem', { lineHeight: '1.1' }],
        lede: ['1.125rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        xs: ['0.8125rem', { lineHeight: '1.5' }],
        micro: ['0.75rem', { lineHeight: '1.5' }],
      },
      spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 7: '32px', 8: '40px' },
      borderRadius: { DEFAULT: '12px', sm: '8px', pill: '999px' },
      boxShadow: {
        DEFAULT: '0 1px 2px rgba(15, 23, 42, 0.06)',
        md: '0 2px 4px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.06)',
        lg: '0 8px 28px rgba(15, 23, 42, 0.10)',
      },
      maxWidth: { text: '1200px' },
      gridTemplateColumns: {
        shell: '264px minmax(0, 1fr) 360px',
      },
      transitionTimingFunction: { out: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      transitionDuration: { DEFAULT: '200ms' },
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    },
  },
  plugins: [],
};
