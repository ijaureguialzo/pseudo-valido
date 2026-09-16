import { ref, type Ref } from 'vue'

export interface Archivo {
   nombre: string
   contenido: string
}

export interface StorageLike {
   getItem(key: string): string | null
   setItem(key: string, value: string): void
   removeItem(key: string): void
}

export interface Opciones {
   storage?: StorageLike
   aviso?: (msg: string) => void
}

const CLAVE_FILES = 'pseudo-valido/files'
const CLAVE_ACTIVO = 'pseudo-valido/active'

export function useArchivos(opts: Opciones = {}) {
  const almacenamiento: StorageLike | undefined =
     opts.storage
      || (typeof localStorage !== 'undefined' ? localStorage : undefined)
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
