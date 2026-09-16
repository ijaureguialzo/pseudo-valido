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

// Tab inserta 2 espacios (en vez de mover el foco fuera del editor).
function manejarTeclas(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return
  event.preventDefault()
  const ta = event.target as HTMLTextAreaElement
  const inicio = ta.selectionStart
  const fin = ta.selectionEnd
  const nueva = ta.value.substring(0, inicio) + '  ' + ta.value.substring(fin)
  ta.value = nueva
  ta.selectionStart = ta.selectionEnd = inicio + 2
  emit('actualizar', nueva)
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
