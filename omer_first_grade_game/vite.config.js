import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ההקראה הקולית מתבצעת בדפדפן דרך Web Speech API (ראה src/utils/speechUtils.js),
// כך שאין צורך בשרת TTS חיצוני — המשחק רץ בכל סביבה עם `npm run dev`.
export default defineConfig({
  plugins: [react()],
})
