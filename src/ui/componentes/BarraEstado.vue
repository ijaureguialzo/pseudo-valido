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
</script>

<template>
   <footer class="barra-estado" :data-estado="estado">
     <span v-if="nombreActivo" data-testid="nombre">{{ nombreActivo }}</span>
     <span v-else data-testid="sin-archivo">Sin archivo</span>
     <span class="estado" :class="{ ok: nErrores === 0, err: nErrores > 0 }">{{ estado }}</span>
 </  footer>
</template>

<style scoped>
 .barra-estado { padding: 4px 8px; font-size: 13px; background: #333; color: #eee }
 .estado.ok { color: #4f4 }
 .estado.err { color: #f44 }
</style>
