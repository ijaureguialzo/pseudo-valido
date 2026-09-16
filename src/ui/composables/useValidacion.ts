import { ref, watch, onUnmounted, getCurrentInstance, type Ref } from 'vue'
import type { Diagnostico } from '../../validador/tipos'

export interface ResultValidacion {
   correcto: boolean
   diagnosticos: Diagnostico[]
}

export interface Opciones {
   texto: Ref<string>
   validar: (src: string) => ResultValidacion
   debounceMs?: number
   auto?: boolean
}

export function useValidacion(opts: Opciones) {
   const debounceMs = opts.debounceMs ?? 300
   const auto = opts.auto ?? true

   const diagnosticos = ref<Diagnostico[]>([])
   const correcto = ref<boolean>(true)

   function aplicar(r: ResultValidacion): void {
     diagnosticos.value = r.diagnosticos
     correcto.value = r.correcto
      }

   let temporizador: ReturnType<typeof setTimeout> | null = null

   // planifica: aplica ahora si debounceMs===0, o programado con retardo.
   function planifica(): void {
     if (debounceMs === 0) {
       aplicar(opts.validar(opts.texto.value))
       return
        }
     if (temporizador) clearTimeout(temporizador)
     temporizador = setTimeout(() => {
       aplicar(opts.validar(opts.texto.value))
         }, debounceMs)
      }

   function recalcular(): void {
      // fuerza validación inmediata (ignora el debounce)
     if (temporizador) clearTimeout(temporizador)
     aplicar(opts.validar(opts.texto.value))
      }

   if (auto) {
     watch(opts.texto, planifica)
     planifica()
       }

   function dispose(): void {
     if (temporizador) clearTimeout(temporizador)
       }
   const inst = getCurrentInstance()
   if (inst) {
     onUnmounted(dispose)
       }

   return { diagnosticos, correcto, recalcular, dispose }
 }
