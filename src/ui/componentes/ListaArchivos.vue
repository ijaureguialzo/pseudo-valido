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

function alBorrar(nombre: string): void {
  if (window.confirm(`¿Está seguro? Se borrará «${nombre}».`)) {
    emit('borrar', nombre)
  }
}
</script>

<template>
  <aside class="lista-archivos">
    <div class="cabecera">
      <h2 class="titulo-seccion">
        Archivos
      </h2>
      <button
        class="btn-accion"
        data-testid="btn-nuevo"
        @click="emit('nuevo')"
      >
        Nuevo
      </button>
    </div>
    <ul class="lista">
      <li
        v-for="f in archivos"
        :key="f.nombre"
        :data-archivo-name="f.nombre"
        :class="{ activo: f.nombre === activo }"
        @click="emit('seleccionar', f.nombre)"
      >
        <span class="nombre">{{ f.nombre }}</span>
        <button
          class="btn-icono"
          data-testid="btn-renombrar"
          @click.stop="alRenombrar(f.nombre)"
        >
          <i class="bi bi-pencil"></i>
        </button>
        <button
          class="btn-icono"
          data-testid="btn-borrar"
           @click.stop="alBorrar(f.nombre)"
        >
          <i class="bi bi-trash btn-borrar"></i>
        </button>
      </li>
      <li
        v-if="archivos.length === 0"
        class="vacio"
      >
        Sin archivos
      </li>
    </ul>
  </aside>
</template>

<style scoped>
/* Usa tokens temáticos de la app (--pv-*) que derivan de Pico para modo
   claro/oscuro automático; la tipografía procede de Pico. */
.lista-archivos {
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1 1 auto;
  overflow: auto;
}

.cabecera {
  padding-left: 0.5rem;
  padding-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.titulo-seccion {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: var(--pico-font-family, system-ui, sans-serif);
  color: var(--pv-text);
}

.btn-accion {
  font-size: 0.8rem;
  font-family: var(--pico-font-family, system-ui, sans-serif);
  padding: 0.3rem 0.6rem;
  min-width: 3rem;
}

.lista {
  list-style: none;
  margin: 0;
  padding-left: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.lista li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: var(--pico-font-family, system-ui, sans-serif);
  color: var(--pv-text);
  background: transparent;
  transition: background-color 150ms ease, border-color 150ms ease;
}

.lista li:hover {
  background: var(--pv-surface);
  border: 1px solid var(--pv-border);
}

.lista li.activo {
  background: var(--pv-primary);
  border: 1px solid var(--pv-primary);
  color: var(--pv-on-primary);
  font-weight: 600;
}

.lista li.activo .btn-icono {
  /* El botón tiene su propio fondo (--pv-surface), por eso usa el color de
     texto normal y NO el inverso sobre el primario de la fila. */
  color: var(--pv-text);
}

.lista li.vacio {
  padding: 0.5rem 0.6rem;
  font-style: italic;
  color: var(--pv-text-muted);
  cursor: default;
  opacity: 0.7;
}

.nombre {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-icono {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border: 1px solid var(--pv-border);
  border-radius: 0.2rem;
  background: var(--pv-surface);
  color: var(--pv-text);
  font-family: var(--pico-font-family, system-ui, sans-serif);
  cursor: pointer;
  transition: background-color 100ms ease;
}

.btn-icono:hover {
  background: var(--pv-surface-secondary);
}

.btn-borrar {
  color: var(--pv-danger);
}

@media (max-width: 768px) {
   .lista-archivos {
     max-height: 200px;
     }
}
</style>
