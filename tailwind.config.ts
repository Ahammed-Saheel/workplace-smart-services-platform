import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#12151C',
          50: '#F4F5F7',
          100: '#E7E9ED',
          200: '#C7CBD4',
          300: '#9BA1B0',
          400: '#6B7185',
          500: '#4A4F62',
          600: '#363A49',
          700: '#262933',
          800: '#1A1C24',
          900: '#12151C',
        },
        paper: {
          DEFAULT: '#F6F7F5',
          dim: '#EFF0EE',
        },
        amber: {
          DEFAULT: '#E8963C',
          50: '#FDF4E9',
          100: '#FAE6C9',
          200: '#F3CB8D',
          300: '#EDAF61',
          400: '#E8963C',
          500: '#CC7A22',
          600: '#A6621B',
          700: '#7C4A15',
        },
        teal: {
          DEFAULT: '#12897B',
          50: '#E7F5F3',
          100: '#C6E7E2',
          200: '#8FCFC5',
          300: '#57B6A6',
          400: '#12897B',
          500: '#0E6E63',
          600: '#0A554C',
          700: '#073C36',
        },
        line: '#E4E6EA',
      },
      fontFamily: {
        display: [
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'ui-serif',
          'serif',
        ],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,21,28,0.04), 0 1px 12px rgba(18,21,28,0.06)',
        pop: '0 8px 30px rgba(18,21,28,0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ticket-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'ticket-in': 'ticket-in 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
