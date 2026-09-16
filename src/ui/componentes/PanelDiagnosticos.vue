<script setup lang="ts">
import type { Diagnostico } from '../../validador/tipos'

const props = defineProps<{
  diagnosticos: Diagnostico[]
}>()

const emit = defineEmits<{
  seleccionarError: [diagnostico: Diagnostico]
}>()

const errores = () => props.diagnosticos.filter((d) => d.severity === 'error')
const avisos = () => props.diagnosticos.filter((d) => d.severity === 'warning')
</script>

<template>
  <aside class="panel-diagnosticos">
    <h3 class="titulo">
      Resultados
    </h3>
    <p
      v-if="diagnosticos.length === 0"
      class="ok-msg"
      data-testid="ok"
    >
      OK — Sin errores
    </p>
    <ul
      v-if="errores().length > 0"
      class="errores"
    >
      <li
        v-for="d in diagnosticos"
        :key="d.code + d.line + d.column"
        :data-code="d.code"
        :class="d.severity === 'warning' ? 'diagnostico avisado' : 'diagnostico erroneo'"
        @click="emit('seleccionarError', d)"
      >
        <span class="linea-col">L{{ d.line }}, C{{ d.column }}</span>
        <span class="code">{{ d.code }}</span>
        <span class="msg">{{ d.message }}</span>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
/* Tokens temáticos de la app (--pv-*) para modo claro/oscuro; tipografía de Pico. */
.panel-diagnosticos {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-family: var(--pico-font-family, system-ui, sans-serif);
  color: var(--pv-text);
  background: var(--pv-surface);
  overflow: auto;
}

.titulo {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: var(--pico-font-family, system-ui, sans-serif);
  color: var(--pv-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.85;
}

.ok-msg {
  margin: 0;
  padding: 0.25rem 0;
  font-weight: 600;
  color: var(--pv-success);
}

.errores {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.diagnostico {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.3rem 0.4rem;
  border-left: 3px solid transparent;
  border-radius: 0.15rem;
  cursor: pointer;
  transition: background-color 100ms ease;
}

.diagnostico.erroneo {
  border-left-color: var(--pv-danger);
}

.diagnostico.avisado {
  border-left-color: var(--pv-warning);
}

.diagnostico:hover {
  background: var(--pv-surface-secondary);
}

.linea-col {
  font-weight: 600;
  font-family: var(--pico-font-family-monospace, ui-monospace, monospace);
  font-size: 0.8rem;
  white-space: nowrap;
}

.diagnostico.erroneo .linea-col {
  color: var(--pv-danger);
}

.diagnostico.avisado .linea-col {
  color: var(--pv-warning);
}

.code {
  font-family: var(--pico-font-family-monospace, ui-monospace, monospace);
  font-size: 0.8rem;
  opacity: 0.85;
}

.msg {
  flex: 1 1 auto;
  font-family: var(--pico-font-family, system-ui, sans-serif);
  font-size: 0.85rem;
}
</style>
