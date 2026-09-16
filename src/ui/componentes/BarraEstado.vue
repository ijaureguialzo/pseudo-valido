<script setup lang="ts">
import { computed } from 'vue'
import type { Diagnostico } from '../../validador/tipos'

const props = defineProps<{
  diagnosticos: Diagnostico[]
  nombreActivo: string | null
}>()

const nErrores = computed(() => props.diagnosticos.filter((d) => d.severity === 'error').length)
const nAvisos = computed(() => props.diagnosticos.filter((d) => d.severity === 'warning').length)
const estado = computed(() => {
   if (nErrores.value === 0) return 'OK'
   return `${nErrores.value} error(es), ${nAvisos.value} aviso(s)`
})
const estadoClase = computed(() => (nErrores.value === 0 ? 'ok' : 'err'))
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
    <span
      class="estado"
      :class="estadoClase"
      data-testid="estado"
    >{{ estado }}</span>
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
  margin-left: auto;
  font-weight: 600;
}

.estado.ok {
  color: var(--pv-success);
}

.estado.err {
  color: var(--pv-danger);
}
</style>
