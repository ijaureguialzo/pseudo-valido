<template>
  <div
    class="editor-codigo"
    data-testid="editor-codigo"
  >
    <!-- Gutter de números de línea, sincronizado con el scroll del textarea -->
    <div
      class="editor-gutter"
      aria-hidden="true"
    >
      <div
        v-for="(n, idx) in lineas"
        :key="idx"
        class="gutter-numero"
      >
        {{ n }}
      </div>
    </div>
    <textarea
      class="editor-entrada"
      data-testid="editor-entrada"
      :value="valor"
      :spellcheck="false"
      autocomplete="off"
      autocapitalize="off"
      @input="handleInput"
      @scroll="sincronizarScroll"
      @keydown="manejarTeclas"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  valor: string
}>()
const emit = defineEmits<{
  (e: 'actualizar', v: string): void
}>()

// Números de línea según el contenido actual (1-indexado).
const lineas = computed<number[]>(() => {
  const v = props.valor ?? ''
  const n = v.length === 0 ? 1 : v.split('\n').length
  return Array.from({ length: n }, (_, i) => i + 1)
})

function handleInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  emit('actualizar', target.value)
}

// Sincroniza el desplazamiento del gutter con el del textarea.
function sincronizarScroll(event: Event): void {
  const ta = event.target as HTMLTextAreaElement
  const gutter = ta.parentElement?.querySelector('.editor-gutter') as HTMLElement | null
  if (gutter) gutter.scrollTop = ta.scrollTop
}

// Tab inserta 2 espacios (no mueve el foco). Con una selección de varias líneas,
// Tab sangra el bloque entero y Shift+Tab lo desangra (recorta la sangría).
const INDENT = '  '     // 2 espacios por nivel de anidamiento

// Límites del bloque de líneas que la selección [s, e) recorre. La selección de
// un textarea es un rango de caracteres; para sangrar "el bloque" se expande al
// inicio y fin de las líneas que toca (incluida la del cursor cuando no hay
// selección). 'cursor' es cierto si s === e (un solo cursor, sin selección).
function rangoBloque(
     v: string, s: number, e: number):
      { inicio: number; fin: number; cursor: boolean } {
   const inicio = s === 0 ? 0 : v.lastIndexOf('\n', s - 1) + 1
    // El final se toma en la línea que contiene el extremo: si 'e' cae sobre un
     // '\n' el bloque llega hasta ese salto; si no, hasta el final de la línea.
    const fin = e === 0 ? 0
       : (v[e - 1] === '\n' ? e : (v.indexOf('\n', e) === -1 ? v.length : v.indexOf('\n', e)))
   return { inicio, fin, cursor: s === e }
}

function indentarBloque(ta: HTMLTextAreaElement): void {
   const v = ta.value
   // Capturamos la selección ANTES de tocar el valor: una vez asignado
   // 'ta.value', algunos navegadores reajustan/colapsan la selección al final,
   // y releer 'ta.selectionEnd' arrastraría el final hasta el fin del archivo.
   const s0 = ta.selectionStart
   const e0 = ta.selectionEnd
   const { inicio, fin, cursor } = rangoBloque(v, s0, e0)
     // Cada línea del bloque (incluida la vacía final del 'split') gana 2 espacios.
   const lineas = v.slice(inicio, fin).split('\n')
   const total = 2 * lineas.length // nº total de espacios añadidos en el bloque
   const nuevoBloque = lineas.map((l) => INDENT + l).join('\n')
   const nueva = v.slice(0, inicio) + nuevoBloque + v.slice(fin)
   ta.value = nueva
     // La nueva posición de un carácter p se desplaza por los 2 espacios que se
    // añadieron a cada línea del bloque que le precede. Se calcula a partir de la
    // posición ORIGINAL (s0/e0), no de la selección del DOM tras la reasignación.
   const shift = (p: number): number => {
     if (p <= inicio) return p
     if (p >= fin) return p + total
     let ne = 0
     for (let i = inicio; i < p; i++) if (v[i] === '\n') ne++
       return p + 2 + 2 * ne
        }
   const ns = shift(s0)
      // Con cursor (selección nula) el final coincide con el inicio; en caso
     // contrario cada extremo se desplaza sobre su propia línea.
    const ne = cursor ? ns : shift(e0)
   ta.selectionStart = Math.min(ns, nueva.length)
   ta.selectionEnd = Math.min(ne, nueva.length)
   emit('actualizar', nueva)
}

function dedentarBloque(ta: HTMLTextAreaElement): void {
   const v = ta.value
    // Se captura la selección antes de reasignar 'ta.value' por la misma razón
    // que en 'indentarBloque': el DOM puede colapsarla.
   const s0 = ta.selectionStart
   const e0 = ta.selectionEnd
   const { inicio, fin, cursor } = rangoBloque(v, s0, e0)
      // Por línea: se retira un tab o, si no hay, hasta 2 espacios de cabecera.
    const retiros: number[] = []
   const nuevoBloque = v.slice(inicio, fin).split('\n').map((l) => {
      let rem = 0
      if (l.startsWith('\t')) rem = 1
      else {
        const m = l.match(/^ {1,2}/)
        if (m) rem = m[0].length
            }
      retiros.push(rem)
      return l.slice(rem)
             })
   const totalRetirado = retiros.reduce((a, b) => a + b, 0)
   const nueva = v.slice(0, inicio) + nuevoBloque.join('\n') + v.slice(fin)
   ta.value = nueva
       // Extremos desplazados a la izquierda por lo retirado en su línea. Se
      // calculan desde las posiciones originales (s0/e0) y de 'fin' original; el
      // bloque se acortó en 'totalRetirado' caracteres, todos dentro de [inicio, fin).
   const remInicio = retiros[0] ?? 0
   const ns = Math.max(inicio + remInicio, s0 - remInicio)
   const ne = cursor ? ns : Math.max(inicio + remInicio, fin - totalRetirado)
   ta.selectionStart = Math.min(ns, nueva.length)
   ta.selectionEnd = Math.min(ne, nueva.length)
   emit('actualizar', nueva)
}

// Tab indenta y Shift+Tab desindenta (bloque entero si hay selección).
function manejarTeclas(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return
  event.preventDefault()
  const ta = event.target as HTMLTextAreaElement
  if (event.shiftKey) dedentarBloque(ta)
  else indentarBloque(ta)
}
</script>

<style scoped>
/* El editor usa tokens de la app (--pv-*) que derivan del tema de Pico, de
   modo que el modo claro/oscuro funciona sin estilos extra. La tipografía
   monoespaciada procede de Pico. */
.editor-codigo {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  background: var(--pv-surface);
  border: 1px solid var(--pv-border);
  border-radius: 0.25rem;
  overflow: hidden;
  font-family: var(--pico-font-family-monospace, ui-monospace, monospace);
}

.editor-gutter {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 0.4rem 0.35rem 0.4rem 0.55rem;
  min-width: 2.5rem;
  color: var(--pv-text-muted);
  font-variant-numeric: tabular-nums;
  user-select: none;
  background: var(--pv-surface-secondary);
  border-right: 1px solid var(--pv-border);
  overflow: hidden;
  font-family: var(--pico-font-family-monospace, ui-monospace, monospace);
  font-size: 0.9rem;
}

.gutter-numero {
  line-height: 1.5;
  text-align: right;
  padding: 0.05em 0.15em;
}

.editor-entrada {
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  outline: none;
  resize: none;
  padding: 0.4rem 0.6rem;
  margin: 0;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--pv-text);
  background: transparent;
  white-space: pre;
  tab-size: 2;
}

.editor-entrada:focus {
  box-shadow: inset 0 0 0 2px var(--pv-primary);
}
</style>
