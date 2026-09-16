import { ref, type Ref } from 'vue'

export interface Archivo {
   nombre: string
   contenido: string
}

export interface StorageLike {
   getItem(key: string): string | null
   setItem(key: string, value: string): void
   removeItem(key: string): void
   readonly length: number
}

const CLAVE_FILES = 'pseudo-valido/files'
const CLAVE_ACTIVO = 'pseudo-valido/active'

// Sentinela que obliga a "modo memoria con aviso" sin recurrir al global de
// localStorage (en los entornos de test happy-dom/JS-DOM, ese global existe y
// taparía el aviso). Se declara antes que el tipo `SinStorage`.
export const CLAVE_NO_STORAGE: unique symbol = Symbol('no-storage')

// Sentinela que obliga a "modo memoria con aviso" sin recurrir al global de
// localStorage (en los entornos de test happy-dom/JS-DOM, este existe).
export type SinStorage = typeof CLAVE_NO_STORAGE

export interface Opciones {
   storage?: StorageLike | SinStorage
   aviso?: (msg: string) => void
}

export function useArchivos(opts: Opciones = {}) {
     // Tres casos:
     //  - storage dado  -> se usa ese.
     //  - CLAVE_NO_STORAGE -> modo memoria con aviso (sin global, para tests).
     //  - undefined (no se pasó) -> se usa el global localStorage si existe;
     //    en entornos de test sin global se cae a modo memoria con aviso.
    let almacenamiento: StorageLike | undefined
    if (opts.storage === CLAVE_NO_STORAGE) {
       almacenamiento = undefined
        } else if (opts.storage !== undefined) {
       almacenamiento = opts.storage
        } else {
       almacenamiento = typeof localStorage !== 'undefined' ? localStorage : undefined
        }

    if (!almacenamiento) {
       opts.aviso?.('localStorage no disponible: los cambios no se guardarán')
        }

  const lista: Ref<Archivo[]> = ref([])
  const activo: Ref<Archivo | null> = ref(null)

  function esUnico(nombre: string): boolean {
    const base = nombre.split('.')[0]
    return lista.value.every((f) => f.nombre.split('.')[0] !== base)
   }

  function recargar(): void {
    if (!almacenamiento) return
    const crudos = almacenamiento.getItem(CLAVE_FILES)
    const arr: Archivo[] = crudos ? JSON.parse(crudos) : []
    lista.value = arr
    const nombreActivo = almacenamiento.getItem(CLAVE_ACTIVO)
    activo.value = arr.find((f) => f.nombre === nombreActivo) ?? arr[0] ?? null
    }

  function persistir(): void {
    if (!almacenamiento) return
    try {
      almacenamiento.setItem(CLAVE_FILES, JSON.stringify(lista.value))
      if (activo.value) almacenamiento.setItem(CLAVE_ACTIVO, activo.value.nombre)
    } catch {
      opts.aviso?.('No se pudo guardar en localStorage')
    }
  }

  function nuevo(nombre?: string, contenido: string = ''): void {
    let n = nombre ?? 'sin-titulo'
    if (!esUnico(n)) {
      let i = 1
      while (!esUnico(`sin-titulo-${i}`)) i++
      n = `sin-titulo-${i}`
    }
    lista.value.push({ nombre: n, contenido })
    activo.value = { nombre: n, contenido }
    persistir()
  }

  function activar(nombre: string): void {
    const f = lista.value.find((x) => x.nombre === nombre)
    if (f) {
      activo.value = f
      persistir()
    }
  }

  function renombrar(nombre: string, nuevoNombre: string): void {
    if (nombre === nuevoNombre) return
    if (!esUnico(nuevoNombre)) throw new Error(`Ya existe '${nuevoNombre}'`)
    const f = lista.value.find((x) => x.nombre === nombre)
    if (!f) throw new Error(`No existe '${nombre}'`)
    f.nombre = nuevoNombre
    if (activo.value?.nombre === nombre) activo.value = f
    persistir()
  }

  function borrar(nombre: string): void {
    const idx = lista.value.findIndex((x) => x.nombre === nombre)
    if (idx === -1) throw new Error(`No existe '${nombre}'`)
    lista.value.splice(idx, 1)
    if (activo.value?.nombre === nombre) {
      activo.value = lista.value[idx] ?? lista.value[idx - 1] ?? null
    }
    persistir()
  }

  function actualizarContenido(nuevoContenido: string): void {
    if (activo.value) {
      activo.value.contenido = nuevoContenido
      persistir()
    }
  }

  recargar()

  return { lista, activo, nuevo, activar, renombrar, borrar, actualizarContenido, recargar }
}
