import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Config de build/dev (Vite). Los tests usan `vitest.config.ts` (lo extienden
// con los ajustes de Vitest). Aquí solo va lo que Vite necesita en producción.
export default defineConfig({
  plugins: [vue()],
})
