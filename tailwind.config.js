/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors:{
        'primary':'#1476ff',
        'secondary':'#f3f5ff',
        'light':'#f9faff'
      },
    },
  },
  plugins: [
    function({addUtilities}){
      const newUtilities = {
        '.no-scrollbar::-webkit-scrollbar':{
          display:"none",
        },
        ".no-scrollbar":{
          "-ms-overflow-style":"none",
          "scrollbar-width":"none"
        }
      };

      addUtilities(newUtilities)
    },
  ],
}

