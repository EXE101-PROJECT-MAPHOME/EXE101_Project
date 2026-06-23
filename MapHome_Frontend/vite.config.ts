import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load environment variables based on the active mode
  const env = loadEnv(mode, process.cwd(), '');
  const useLocalBackend = env.VITE_USE_LOCAL_BACKEND === 'true';
  const backendTarget = useLocalBackend 
    ? 'http://localhost:5000' 
    : (env.VITE_API_BASE || 'https://exe101project-maphome-api.up.railway.app');

  return {
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true, // Allows mobile devices in the same LAN to access the web server
      port: 5173,
      proxy: {
        // Optional proxy fallback for local development
        '/api-proxy': {
          target: backendTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-proxy/, '/api'),
        },
      },
    },
  };
})
