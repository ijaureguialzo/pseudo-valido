/// <reference types="vitest/globals" />

declare module '*.vue' {
   import type { Component } from 'vue'
  const comp: Component
  export default comp
}

// Importaciones CSS (framework Pico) se tratan como módulos con efecto
// secundario; Vite/Rollup las procesan, vue-tsc no necesita sus tipos.
declare module '*.css' {
  const content: string
  export default content
}

interface Window {
  matchMedia?: (q: string) => MediaQueryList
}
