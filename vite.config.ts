import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // CRITICAL FIX: This injects the API_KEY into the build so the browser can see it.
      // Without this, the app crashes with a white screen.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  }
})
// Forced update for Vercel deployment check v1.4