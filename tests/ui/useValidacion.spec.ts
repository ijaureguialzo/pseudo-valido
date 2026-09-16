import { describe, it, expect, vi, afterEach } from 'vitest'
import { ref } from 'vue'
import { useValidacion } from '../../src/ui/composables/useValidacion'
import { validar } from '../../src/validador'

describe('useValidacion', () => {
   afterEach(() => { vi.useRealTimers() })

   it('debounce 300ms: 5 ediciones -> 1 llamada a validar', () => {
     vi.useFakeTimers()
     const texto = ref('a')
     let llamadas = 0
     const a = useValidacion({
       texto,
       validar: (src: string) => { llamadas++; return validar(src) },
       debounceMs: 300,
         })
     // 5 ediciones rapidas en el mismo tick -> todas coalescen
     texto.value = 'b'; texto.value = 'c'; texto.value = 'd'; texto.value = 'e'
     expect(llamadas).toBe(0)
     vi.advanceTimersByTime(350)
     expect(llamadas).toBe(1)
     vi.advanceTimersByTime(350)
     expect(llamadas).toBe(1) // sin cambios, no valida
     a.dispose()
       })

   it('exponer resultado correcto (true, 0 diagnosticos)', () => {
     const texto = ref('Algoritmo A\nFinAlgoritmo')
     const a = useValidacion({ texto, validar, debounceMs: 0 })
     expect(a.correcto.value).toBe(true)
     expect(a.diagnosticos.value.length).toBe(0)
     a.dispose()
       })

   it('emite M-001 para variable no declarada', () => {
     const texto = ref('Algoritmo A\nEscribir x\nFinAlgoritmo')
     const a = useValidacion({ texto, validar, debounceMs: 0 })
     expect(a.correcto.value).toBe(false)
     expect(a.diagnosticos.value.some((d) => d.code === 'M-001')).toBe(true)
     a.dispose()
       })

   it('recalcular() fuerza validacion inmediata', () => {
     const texto = ref('Algoritmo A\nEscribir x\nFinAlgoritmo')
     const a = useValidacion({ texto, validar, debounceMs: 1000, auto: false })
     expect(a.diagnosticos.value.length).toBe(0) // auto false => no valida
     a.recalcular()
     expect(a.diagnosticos.value.length).toBeGreaterThan(0)
     a.dispose()
       })
})
