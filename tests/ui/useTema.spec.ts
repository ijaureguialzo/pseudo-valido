import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useTema } from '../../src/ui/composables/useTema'

// happy-dom no expone un localStorage funcional, así que inyectamos uno en
// memoria (el composable ya acepta `storage` como punto de extensión, igual que
// useArchivos).
function mkStorage(prefill: Record<string, string> = {}): Storage {
  const m = new Map<string, string>(Object.entries(prefill))
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    get length() { return m.size },
    clear: () => void m.clear(),
    key: (i: number) => {
      const arr = Array.from(m.keys())
      return arr[i] ?? null
       },
  } as Storage
}

// Simula el valor de prefers-color-scheme que vería el navegador.
function setMediaDark(dark: boolean): void {
  (window as any).matchMedia = (q: string) => ({
    matches: q.includes('dark') ? dark : !q.includes('dark'),
    media: q,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() { return false },
   })
}

beforeEach(() => {
  setMediaDark(true) // por defecto el "sistema" pide tema oscuro
})

afterEach(() => {
  delete (window as any).matchMedia
  document.documentElement.removeAttribute('data-theme')
})

describe('useTema', () => {
  it('modo automático sigue prefers-color-scheme (sistema oscuro -> data-theme=dark)', () => {
    const t = useTema()
    expect(t.modo.value).toBe('auto')
    expect(document.documentElement.dataset.theme).toBe('dark')
    t.dispose()
   })

  it('seleccionar "claro" aplica data-theme=light y persiste la preferencia', () => {
    const storage = mkStorage()
    const t = useTema({ storage })
    t.elegir('claro')
    expect(t.modo.value).toBe('claro')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(storage.getItem('pseudo-valido/theme')).toBe('claro')
    t.dispose()
   })

  it('seleccionar "oscuro" aplica data-theme=dark aunque el sistema pida claro', () => {
    setMediaDark(false) // el sistema pide tema claro
    const t = useTema()
    t.elegir('oscuro')
    expect(t.modo.value).toBe('oscuro')
    expect(document.documentElement.dataset.theme).toBe('dark')
    t.dispose()
   })

  it('restaura la preferencia guardada al crear el composable', () => {
    const storage = mkStorage({ 'pseudo-valido/theme': 'claro' })
    const t = useTema({ storage })
    expect(t.modo.value).toBe('claro')
    expect(document.documentElement.dataset.theme).toBe('light')
    t.dispose()
   })
})
