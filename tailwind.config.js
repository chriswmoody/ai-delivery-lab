/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint:  '#7dd4bd',
        peach: '#e8a880',
        sky:   '#7aafd4',
        rose:  '#e8b8c4',
        cream: '#faf9f7',
        sand:  '#f0ede8',
        ink:   '#0c0a09',
        slate: '#4a4540',
        mist:  '#c8c2bc',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
}
