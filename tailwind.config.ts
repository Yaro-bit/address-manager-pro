// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',       // include mdx in case you use it in /app
    './components/**/*.{js,ts,jsx,tsx,mdx}' // same for components
  ],
  theme: {
    extend: {
      // put all your customizations here
      colors: {
        brand: {
          DEFAULT: '#2563eb', // example: brand blue
        },
      },
    },
  },
  plugins: [],
};

export default config;
