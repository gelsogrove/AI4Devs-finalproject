import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load all environment variables regardless of prefix for server configuration
  // Note: Client-side code can only access variables with VITE_ prefix
  const env = loadEnv(mode, process.cwd(), '');
  const frontendPort = parseInt(env.PORT || '3000');
  const backendPort = parseInt(env.API_PORT || '3001');

  return {
    server: {
      host: "::",
      port: frontendPort,
      proxy: {
        '/api': `http://localhost:${backendPort}`
      }
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
