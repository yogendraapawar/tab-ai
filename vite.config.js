import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './public/manifest.json'

export default defineConfig({
  plugins: [
    react(),
    crx({
      manifest,
      contentScripts: {
        injectCss: true,
      }
    })
  ],
  server: {
    port: 5174,
    host: 'localhost',
    hmr: {
      port: 5174,
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/chunk-[hash].js'
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
