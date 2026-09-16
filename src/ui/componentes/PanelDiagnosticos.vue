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
     <h3>Resultados</h3>
     <p v-if="diagnosticos.length === 0" class="ok" data-testid="ok">OK — Sin errores</p>
     <ul v-if="errores().length > 0" class="errores">
       <li
         v-for="d in diagnosticos"
         :key="d.code + d.line + d.column"
         :data-code="d.code"
         class="diagnostico"
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
 .panel-diagnosticos { padding: 8px; font-size: 13px }
 .errores li { padding: 3px 0; cursor: pointer }
 .linea-col { font-weight: bold; color: #c00 }
 .code { margin: 0 6px; font-family: monospace }
 .ok { color: green; font-weight: bold }
</style>
