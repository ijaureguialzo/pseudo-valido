<script setup lang="ts">
 import { ref } from 'vue'
  import type { Archivo } from '../composables/useArchivos'

  const props = defineProps<{
    archivos: Archivo[]
    activo: string | null
     }>()

  const emit = defineEmits<{
    seleccionar: [nombre: string]
    nuevo: []
    renombrar: [nombre: string, nuevo: string]
    borrar: [nombre: string]
     }>()

  const nuevoNombre = ref('')
  const renomearNombre = ref('')

  function alRenombrar(nombre: string): void {
    const n = window.prompt('Nuevo nombre', nombre)
    if (n && n !== nombre) emit('renombrar', nombre, n)
    renomearNombre.value = ''
    }
</script>

<template>
  <aside class="lista-archivos">
    <div class="cabecera">
      <h2>Archivos</h2>
      <button data-testid="btn-nuevo" @click="emit('nuevo')">Nuevo</button>
    </div>
    <ul>
      <li
        v-for="f in archivos"
        :key="f.nombre"
        :data-archivo-name="f.nombre"
        :class="{ activo: f.nombre === activo }"
        @click="emit('seleccionar', f.nombre)">
        <span class="nombre">{{ f.nombre }}</span>
        <button data-testid="btn-renombrar" @click.stop="alRenombrar(f.nombre)">ren</button>
        <button data-testid="btn-borrar" @click.stop="emit('borrar', f.nombre)">del</button>
      </li>
      <li v-if="archivos.length === 0" class="vacio">Sin archivos</li>
    </ul>
  </aside>
</template>

<style scoped>
 .lista-archivos { padding: 8px }
 li { display: flex; gap: 4px; align-items: center; cursor: pointer }
 li.activo { font-weight: bold }
</style>
