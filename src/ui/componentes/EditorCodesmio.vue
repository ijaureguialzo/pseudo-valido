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
   // Con un cursor plegado (s === e) el bloque es la LÍNEA ENTERA que toca: llega
    // hasta el SIGUIENTE salto al final de esa línea, NO hasta la posición del
    // cursor. Antes, si el cursor estaba justo al inicio de la línea, 'v[s - 1]'
    // era '\n' y 'fin' caía en ese salto; el 'split' daba entonces una línea vacía
    // fantasma que se sangraba en su vacío, INSERTANDO una línea nueva en vez de
    // sangrar/desangrar la línea del cursor. Por eso el fallo solo se veía con el
    // cursor en la primera columna (con selección o después del 1º carácter, 'fin'
    // ya caía tras el salto y todo iba bien).
   if (s === e) {
     const i = v.indexOf('\n', s)
     const fin = i === -1 ? v.length : i
     return { inicio, fin, cursor: true }
    }
       // Selección real [s, e): el final cae en el salto que cierra la última
    // línea tocada; si 'e' ya está sobre un salto, ese es el final.
    const fin = v[e - 1] === '\n' ? e : (v.indexOf('\n', e) === -1 ? v.length : v.indexOf('\n', e))
  return { inicio, fin, cursor: false }
}

function indentarBloque(ta: HTMLTextAreaElement): void {
   const v = ta.value
   // Capturamos la selección ANTES de tocar el valor: una vez asignado
   // 'ta.value', algunos navegadores reajustan/colapsan la selección al final,
   // y releer 'ta.selectionEnd' arrastraría el final hasta el fin del archivo.
   const s0 = ta.selectionStart
   const e0 = ta.selectionEnd
   const { inicio, fin, cursor } = rangoBloque(v, s0, e0)
      // Separar la línea de final del bloque: si 'fin' cae justo sobre un '\n'
     // (selección de líneas completas), ese salto NO forma parte de una línea,
     // sino el cierre de la última. Si lo dejáramos en el slice, el 'split' daría
     // una cadena vacía fantasma que se sangraría — cogiendo la línea siguiente.
   const bloqueHastaFin = v.slice(inicio, fin)
   const finConSalto = fin > 0 && v[fin - 1] === '\n'
   const cuerpoB = finConSalto ? bloqueHastaFin.slice(0, bloqueHastaFin.length - 1) : bloqueHastaFin
   const terminador = finConSalto ? '\n' : ''
      // Cada línea del bloque gana 2 espacios por delante.
      const lineas = cuerpoB.split('\n')
      const nuevoBloque = lineas.map((l) => INDENT + l).join('\n')
      const nueva = v.slice(0, inicio) + nuevoBloque + terminador + v.slice(fin)
   ta.value = nueva
       // Mapeo exacto de una posición ORIGINAL a su nueva posición. Se insertan
      // 2 espacios al inicio de cada línea del cuerpo; una posición p se desplaza
     // por 2 × (nº de inicios de línea situados en p o antes). Se calcula desde
     // la posición original (s0/e0), nunca releyendo la selección del DOM.
     // (Si se cuenta el '\n' de fin de línea como "una línea más", se sangraría
    //  de más: por eso 'cuerpoB' ya excluyó ese salto.)
   let pos = inicio
     const puntos: number[] = []
   for (let k = 0; k < lineas.length; k++) {
    puntos.push(pos)
    pos += lineas[k].length
    if (k < lineas.length - 1) pos += 1 // el '\n' que une a la siguiente línea
       }
   const shift = (p: number): number => {
     let cnt = 0
     for (const q of puntos) { if (q <= p) cnt++; else break }
       return p + 2 * cnt
         }
   const ns = shift(s0)
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
       // Por línea se retira un tab o, si no hay, hasta 2 espacios de cabecera.
      // El salto de fin de línea (si 'fin' cae sobre un '\n') no forma parte de
      // ninguna línea: si se dejara en el slice, el 'split' daría una cadena
      // vacía; como no se le retira nada, es inocua, pero la separamos para
      // reconstruir el texto y el mapeo con claridad.
   const cuerpoB = v.slice(inicio, fin)
   const terminador = fin > 0 && v[fin - 1] === '\n' ? '\n' : ''
   const cuerpo = terminador ? cuerpoB.slice(0, cuerpoB.length - 1) : cuerpoB
   const retiros: number[] = []
   const nuevas = cuerpo.split('\n').map((l) => {
      let rem = 0
      if (l.startsWith('\t')) rem = 1
      else {
        const m = l.match(/^ {1,2}/)
        if (m) rem = m[0].length
        }
      retiros.push(rem)
      return l.slice(rem)
         })
   const nueva = v.slice(0, inicio) + nuevas.join('\n') + terminador + v.slice(fin)
   ta.value = nueva
      // Cada línea se acorta en 'retiros[k]'. Mapeo exacto de una posición p a su
      // nueva: se resta la suma de los retiros de cada línea que la precede o
      // incluye (contados por inicios de línea, igual que en indentar).
   let pos = inicio
     const puntos: number[] = []
   for (let k = 0; k < retiros.length; k++) {
    puntos.push(pos)
    pos += (nuevas[k] ?? '').length
    if (k < retiros.length - 1) pos += 1 // '\n' que une a la siguiente línea
    }
   const shift = (p: number): number => {
    let rem = 0
    for (let k = 0; k < puntos.length; k++) {
      if (puntos[k] <= p) rem += retiros[k]; else break
        }
    return Math.max(inicio, p - rem)
        }
   const ns = shift(s0)
     const ne = cursor ? ns : shift(e0)
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
