/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",            // classic Pages Router
    "./app/**/*.{js,ts,jsx,tsx}",              // App Router, if you use it
    "./components/**/*.{js,ts,jsx,tsx}",       // <── WeatherExplorer lives here
    "./src/**/*.{js,ts,jsx,tsx}",              // if you have a /src setup
  ],
  theme: { extend: {} },
  plugins: [],
};
