import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
    },
  },
  plugins: [
    react(),
    tsconfigPaths(),
    process.env.USE_VISUALIZER === '1' ? visualizer({ open: true, gzipSize: true }) : null,
  ],
});
