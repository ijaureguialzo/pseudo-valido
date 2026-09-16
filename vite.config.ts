import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Config de build/dev (Vite). Los tests usan `vitest.config.ts` (lo extienden
// con los ajustes de Vitest). Aquí solo va lo que Vite necesita en producción.
// La ruta base del deploy se toma de DEPLOY_BASE (la CI la fija en
// `/pseudo-valido/` para GitHub Pages). En dev queda vacía → `/`, sin cambios.
export default defineConfig({
  plugins: [vue()],
  base: process.env.DEPLOY_BASE || '/',
})
