import { describe, it, expect } from 'vitest'
import { useArchivos, type StorageLike } from '../../src/ui/composables/useArchivos'

function mkStorage(prefill?: Record<string, string>): StorageLike {
  const m = new Map<string, string>(Object.entries(prefill ?? {}))
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    get length() { return m.size }
   }
}

describe('useArchivos', () => {
   it('crea un archivo nuevo, lo selecciona y lo persiste', () => {
     const storage = mkStorage()
     const a = useArchivos({ storage })
     a.nuevo('hola')
     expect(a.lista.value.map((f) => f.nombre)).toContain('hola')
     expect((JSON.parse(storage.getItem('pseudo-valido/files')!) as any[])[0].nombre).toBe('hola')
     a.activar('hola')
     expect(a.activo.value!.nombre).toBe('hola')
     expect(storage.getItem('pseudo-valido/active')).toBe('hola')
      })

   it('renombra y borra; borrar inexistente lanza', () => {
     const storage = mkStorage()
     const a = useArchivos({ storage })
     a.nuevo('x')
     a.renombrar('x', 'y')
     expect(a.lista.value.map((f) => f.nombre)).toContain('y')
     expect(() => a.borrar('x')).toThrow()
      })

   it('restaura desde localStorage en una instancia nueva', () => {
     const storage = mkStorage({
        'pseudo-valido/files': JSON.stringify([
          { nombre: 'a.pse', contenido: 'Algoritmo A\nFinAlgoritmo' }
        ]),
        'pseudo-valido/active': 'a.pse'
     })
     const a = useArchivos({ storage })
     expect(a.lista.value.length).toBe(1)
     expect(a.activo.value!.nombre).toBe('a.pse')
      })

   it('sin localStorage -> modo memoria y aviso', () => {
     let aviso = ''
     const a = useArchivos({ storage: undefined as any, aviso: (m: string) => (aviso = m) })
     a.nuevo('mem')
     expect(a.lista.value.map((f) => f.nombre)).toContain('mem')
     expect(aviso.length).toBeGreaterThan(0)
      })

   it('borrar el activo elige el siguiente (o null)', () => {
     const storage = mkStorage()
     const a = useArchivos({ storage })
     a.nuevo('uno')
     a.nuevo('dos')
     a.activar('dos')
     a.borrar('dos')
     expect(a.activo.value!.nombre).toBe('uno')
      })
})
