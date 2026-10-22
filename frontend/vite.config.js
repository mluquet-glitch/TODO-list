import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // En desarrollo el navegador llama a /api y Vite lo reenvía al backend:
      // así no hay problemas de CORS ni URLs absolutas en el código.
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
