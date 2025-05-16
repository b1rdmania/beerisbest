import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    // Keep CSS processing simple to avoid issues
    postcss: './postcss.config.js',
    // Disable advanced minification
    transformer: 'postcss',
    devSourcemap: true,
  },
  build: {
    // Avoid aggressive code splitting
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // Ensure CSS has a stable name
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
          const extType = assetInfo.name.split('.').at(1) || '';
          if (/css/i.test(extType)) {
            return 'assets/styles.[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Ensure assets are copied
    assetsInlineLimit: 0,
  },
})
