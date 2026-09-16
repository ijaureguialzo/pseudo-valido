import { ref, type Ref } from 'vue'

// Modo de tema que elige el usuario. "auto" sigue el sistema
// (prefers-color-scheme de Pico); "claro"/"oscuro" fuerzan `data-theme`.
export type ModoTema = 'auto' | 'claro' | 'oscuro'
// Tema efectivo resuelto contra el sistema.
export type TemaEfetivo = 'light' | 'dark'

const CLAVE_TEMA = 'pseudo-valido/theme'

function isModo(v: string | null | undefined): v is ModoTema {
  return v === 'auto' || v === 'claro' || v === 'oscuro'
}

// Devuelve true si el sistema del usuario prefiere tema oscuro.
export function prefiereOscuro(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export interface OpcionesTema {
  storage?: Storage
}

export interface TemaApi {
  modo: Ref<ModoTema>
   // Aplica el modo a data-theme del documento y lo persiste si no es "auto".
  elegir: (m: ModoTema) => void
   // Cambia al siguiente modo (auto -> claro -> oscuro -> auto).
  alternar: () => void
  releaseListeners: () => void
  dispose: () => void
}

export function useTema(opts: OpcionesTema = {}): TemaApi {
  const storage: Storage | undefined =
   opts.storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined)

  const guardado = storage?.getItem(CLAVE_TEMA) ?? null
  const modo: Ref<ModoTema> = ref<ModoTema>(isModo(guardado) ? guardado : 'auto')

  function themeEfetivo(): TemaEfetivo {
    if (modo.value === 'claro') return 'light'
    if (modo.value === 'oscuro') return 'dark'
    return prefiereOscuro() ? 'dark' : 'light'
    }

  function aplicarTheme(): void {
      // Pico 2.1: [data-theme=light|dark] fuerza el tema y también ajusta
      // `color-scheme`. En "auto" resolvemos el valor efectivo del sistema y lo
      // escribimos explícitamente, de modo que siempre hay un data-theme
      // coherente (evita FOUC y es robusto si cambia el sistema).
    const html = typeof document !== 'undefined' ? document.documentElement : null
    if (!html) return
    html.setAttribute('data-theme', themeEfetivo())
     }

  let listener: MediaQueryList | undefined
  let onSystemChange: () => void = () => {}
  function attach(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    listener = window.matchMedia('(prefers-color-scheme: dark)')
    onSystemChange = () => {
     if (modo.value === 'auto') aplicarTheme()
     }
    listener.addEventListener?.('change', onSystemChange)
    }

  function elegir(m: ModoTema): void {
    modo.value = m
    aplicarTheme()
    if (m === 'auto') {
      storage?.removeItem(CLAVE_TEMA)
     } else {
      storage?.setItem(CLAVE_TEMA, m)
     }
    }

  function alternar(): void {
    const orden: ModoTema[] = ['auto', 'claro', 'oscuro']
    const i = orden.indexOf(modo.value)
    elegir(orden[(i + 1) % orden.length])
    }

  function releaseListeners(): void {
    if (listener && typeof listener.removeEventListener === 'function') {
      listener.removeEventListener('change', onSystemChange)
      }
    listener = undefined
    }

  function dispose(): void {
    releaseListeners()
    }

  // Aplicar la preferencia inicial y seguir cambios del sistema en "auto".
  aplicarTheme()
  attach()

  return { modo, elegir, alternar, releaseListeners, dispose }
}
