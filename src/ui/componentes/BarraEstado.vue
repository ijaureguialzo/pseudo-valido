<script setup lang="ts">
import { computed } from 'vue'
import type { Diagnostico } from '../../validador/tipos'

const props = defineProps<{
  diagnosticos: Diagnostico[]
  nombreActivo: string | null
}>()

const emit = defineEmits<{
  seleccionarError: [diagnostico: Diagnostico]
   // El usuario pide que se le dé formato al archivo abierto.
  formatear: []
}>()

const nErrores = computed(() => props.diagnosticos.filter((d) => d.severity === 'error').length)
const nAvisos = computed(() => props.diagnosticos.filter((d) => d.severity === 'warning').length)
const estado = computed(() => {
   if (nErrores.value === 0) return 'OK'
   return `${nErrores.value} error(es), ${nAvisos.value} aviso(s)`
})
const estadoClase = computed(() => (nErrores.value === 0 ? 'ok' : 'err'))

// Botón discreto de "dar formato": va en la derecha, justo antes del mensaje de
// estado. Se deshabilita cuando no hay archivo abierto.
const hayArchivo = computed(() => props.nombreActivo !== null)
</script>

<template>
  <footer
    class="barra-estado"
    :data-estado="estadoClase"
  >
    <span
      v-if="nombreActivo"
      data-testid="nombre"
      class="barra-nombre"
    >{{ nombreActivo }}</span>
    <span
     v-else
     data-testid="sin-archivo"
     class="secondary"
    >Sin archivo</span>
    <!-- Grupo derecho: botón discreto de formato junto al mensaje de estado. -->
    <div class="barra-acciones">
     <button
      type="button"
      class="btn-formato"
      data-testid="btn-formato"
       :disabled="!hayArchivo"
      title="Dar formato automático al archivo"
      aria-label="Dar formato automático al archivo"
       @click="emit('formatear')"
     >⚡ Formato</button>
     <span
      class="estado"
       :class="estadoClase"
      data-testid="estado"
     >{{ estado }}</span>
     </div>
    </footer>
    </template>

<style scoped>
/* Tokens temáticos de la app (--pv-*): modo claro/oscuro automático. */
.barra-estado {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.5rem 0.75rem;
  background: var(--pv-surface-secondary);
  border-top: 1px solid var(--pv-border);
  font-size: 0.85rem;
  font-family: var(--pico-font-family, system-ui, sans-serif);
  color: var(--pv-text);
}

.barra-nombre {
  font-weight: 600;
  font-family: var(--pico-font-family-monospace, ui-monospace, monospace);
}

.estado {
  font-weight: 600;
}

/* El grupo derecho (botón de formato + estado) se ancla a la derecha. */
.barra-acciones {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin-left: auto;
}

/* Botón discreto: hereda el tamaño de la barra y resalta al pasar el ratón. */
.btn-formato {
  font: inherit;
  font-size: 0.8rem;
  line-height: 1;
  color: var(--pv-text-muted);
  background: var(--pv-surface);
  border: 1px solid var(--pv-border);
  border-radius: 0.25rem;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  transition: color 120ms ease, border-color 120ms ease;
}

.btn-formato:hover:not(:disabled) {
  color: var(--pv-primary);
  border-color: var(--pv-primary);
}

.btn-formato:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.estado.ok {
  color: var(--pv-success);
}

.estado.err {
  color: var(--pv-danger);
}
</style>
