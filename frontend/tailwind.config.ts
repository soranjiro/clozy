import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [
    function (components: { addComponents: (components: Record<string, any>) => void }) {
      const { addComponents } = components;
      addComponents({
        '.btn': {
          padding: '1rem 1.5rem',
          fontWeight: 'bold',
          borderRadius: '0.375rem',
          margin: '0.5rem',
          display: 'inline-block',
          textAlign: 'center',
          '&:disabled': {
            backgroundColor: '#d1d5db',
            cursor: 'not-allowed',
          },
        },
        '.btn-primary': {
          backgroundColor: '#ffffff',
          color: '#8b4513',
          '&:hover': {
            backgroundColor: '#d97706',
            color: '#ffffff',
          },
        },
        '.btn-danger': {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#b91c1c',
          },
        },
      });
    },
  ],
} satisfies Config;
