import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const webRoot = path.resolve(__dirname)
const nm = (...parts: string[]) => path.resolve(webRoot, 'node_modules', ...parts)
const apiTarget = process.env.WEB_DEV_API ?? 'http://127.0.0.1:3000'

export default defineConfig({
  root: webRoot,
  plugins: [react()],
  resolve: {
    // Sources under ../app/src must resolve deps from web/node_modules (server has no app/ install).
    alias: {
      '@app': path.resolve(webRoot, '../app/src'),
      react: nm('react'),
      'react-dom/client': nm('react-dom', 'client.js'),
      'react-dom': nm('react-dom'),
      'react/jsx-runtime': nm('react', 'jsx-runtime.js'),
      'react/jsx-dev-runtime': nm('react', 'jsx-dev-runtime.js'),
      'react-markdown': nm('react-markdown'),
      'remark-gfm': nm('remark-gfm'),
    },
    dedupe: ['react', 'react-dom', 'react-markdown', 'remark-gfm'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-markdown', 'remark-gfm'],
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    fs: {
      allow: [webRoot, path.resolve(webRoot, '../app')],
    },
    proxy: {
      '/auth': { target: apiTarget, changeOrigin: true },
      '/admin': { target: apiTarget, changeOrigin: true },
      '/departments': { target: apiTarget, changeOrigin: true },
      '/media': { target: apiTarget, changeOrigin: true },
      '/sync': { target: apiTarget, changeOrigin: true },
      '/app': { target: apiTarget, changeOrigin: true },
      '/health': { target: apiTarget, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
