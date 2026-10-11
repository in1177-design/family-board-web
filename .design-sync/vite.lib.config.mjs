// בונה את רכיבי האפליקציה כספרייה, לסנכרון עם Claude Design. מריצים מתיקיית family_Board:
// npx vite build --config .design-sync/vite.lib.config.mjs && node .design-sync/build-css.mjs
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))
export default defineConfig({
  root: path.resolve(here, '..'),
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(here, '../src') } },
  build: {
    outDir: path.resolve(here, '../.ds-lib'),
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    lib: { entry: path.resolve(here, 'src/index.jsx'), formats: ['es'], fileName: () => 'index.js' },
    rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'] }
  }
})
