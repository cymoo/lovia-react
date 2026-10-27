import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// No index.html: the lovia chat page is the host. `vite build` emits one ES
// module the page imports as a ChatUI script; `vite` (dev) serves the source
// to `lovia-react --dev`, which loads src/dev.ts cross-origin.
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Library mode leaves process.env.NODE_ENV for a consumer to replace;
  // here the browser is the consumer.
  define:
    command === 'build' ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {},
  // With no index.html to crawl, Vite would discover the deps on the first
  // request and fail it (504 Outdated Optimize Dep) while it re-bundles them.
  optimizeDeps: { entries: ['src/dev.ts'] },
  server: {
    port: 5173,
    strictPort: true,
    // Asset URLs must point back at Vite, not at the lovia page's origin.
    origin: 'http://localhost:5173',
  },
  build: {
    outDir: '../backend/app/ui/dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/main.tsx',
      formats: ['es'],
      fileName: () => 'app.js',
      cssFileName: 'app',
    },
  },
}));
