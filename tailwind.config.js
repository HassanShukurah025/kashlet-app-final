/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          bg: '#0B0F14',
          surface: '#111827',
          card: '#161B22',
          border: '#2A2F3A',
          'border-focus': '#4F46E5',
        },
        text: {
          primary: '#F9FAFB',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
        accent: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#38BDF8',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '40px' }],
        h1: ['28px', { lineHeight: '36px' }],
        h2: ['24px', { lineHeight: '32px' }],
        h3: ['20px', { lineHeight: '28px' }],
        'body-l': ['16px', { lineHeight: '24px' }],
        'body-m': ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
      spacing: {
        4.5: '18px',
        18: '4.5rem',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        card: '12px',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
};
