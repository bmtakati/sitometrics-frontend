import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appName = env.VITE_APP_NAME || 'SITOMETRICS';

  const apiTarget = (env.VITE_API_BASE_URL || 'http://127.0.0.1:8000')
    .replace(/\/$/, '')
    .replace('://localhost', '://127.0.0.1');

  return {
    plugins: [
      react(),
      {
        name: 'html-replace-app-name',
        transformIndexHtml(html) {
          return html.replace(/%VITE_APP_NAME%/g, appName);
        },
      },
    ],
    server: {
      port: 3004,
      open: true,
      // Same-origin /storage in dev → avoids CORS when preview/download/print hits Laravel files
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/storage': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/assets': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/images': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      chunkSizeWarningLimit: 1000,
      rolldownOptions: {
        checks: {
          pluginTimings: false,
        },
      },
    },
  };
});
