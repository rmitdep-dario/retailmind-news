import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deploy no Vercel: a app é servida na raiz do domínio, por isso base = '/'.
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: { port: 5200 },
})
