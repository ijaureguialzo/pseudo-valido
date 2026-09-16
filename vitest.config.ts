import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // @vue/test-utils captura los emit a través del hook de devtools de Vue, que
  // solo existe en el build de desarrollo. Si la shell heredara
  // NODE_ENV=production, Vue cargaría su build de producción y
  // `wrapper.emitted()` devolvería { } siempre. Se fija el modo de test aquí
  // para que la suite sea determinista.
  define: {
     __DEV__: 'true',
     __VUE_PROD_DEVTOOLS__: 'true',
     'process.env.NODE_ENV': JSON.stringify('test'),
    },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/validador/**/*.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 80
      }
    }
  }
})
