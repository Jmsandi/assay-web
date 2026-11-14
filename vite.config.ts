import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In development, /api is proxied to the live portal API without the browser's
// Origin, so local runs need no CORS entry. Builds call VITE_API_BASE_URL directly.
type ProxyLike = { on: (event: 'proxyReq', fn: (req: { removeHeader: (name: string) => void }) => void) => void }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://assay.geneline-x.net',
        changeOrigin: true,
        configure: (proxy) => (proxy as unknown as ProxyLike).on('proxyReq', (req) => req.removeHeader('origin')),
      },
    },
  },
})
