/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5', // لون الأزرار البنفسجي اللي في التصميم
        sidebar: '#f8fafc', // لون القائمة الجانبية
        background: '#f1f5f9' // لون خلفية الداشبورد
      }
    },
  },
  plugins: [],
}
