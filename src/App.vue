<script setup lang="ts">
import { computed } from 'vue'
import ListaArchivos from './ui/componentes/ListaArchivos.vue'
import EditorCodesmio from './ui/componentes/EditorCodesmio.vue'
import PanelDiagnosticos from './ui/componentes/PanelDiagnosticos.vue'
import BarraEstado from './ui/componentes/BarraEstado.vue'
import { useArchivos, type Archivo } from './ui/composables/useArchivos'
import { useValidacion } from './ui/composables/useValidacion'
import { validar } from './validador'

const archivos = useArchivos()

// Crear un archivo por defecto si la lista está vacía (R-11). Se hace en el
// setup (no en onMounted) para que el editor exista incluso en el test.
if (archivos.lista.value.length === 0) {
  archivos.nuevo('sin-titulo-1.pse', '')
}

// Texto en vivo del archivo activo (o cadena vacía si no hay ninguno).
const textoActivo = computed<string>(() => archivos.activo.value?.contenido ?? '')

// Validación en vivo con debounce ~300 ms sobre el contenido del archivo activo.
const { diagnosticos } = useValidacion({
  texto: textoActivo,
  validar,
  debounceMs: 300,
  auto: true,
})

// Manejadores para listar/renombrar/borrar
function onNuevo(): void {
  // El nombre lo gestiona el componente padre; aquí generamos uno único.
  archivos.nuevo(undefined, '')
}

function onSeleccionar(nombre: string): void {
  archivos.activar(nombre)
}

function onRenombrar(nombre: string, nuevo: string): void {
  try {
    archivos.renombrar(nombre, nuevo)
  } catch (e) {
    window.alert((e as Error).message)
  }
}

function onBorrar(nombre: string): void {
  try {
    archivos.borrar(nombre)
  } catch (e) {
    window.alert((e as Error).message)
  }
}

function onEditarContenido(nuevo: string): void {
  archivos.actualizarContenido(nuevo)
}

</script>

<template>
<div class="app-grilla">
  <aside class="panel-izq">
    <div class="cabecera-app">
      <h1 class="titulo-app">pseudo-valido</h1>
    </div>
    <ListaArchivos
      :archivos="archivos.lista.value as Archivo[]"
      :activo="archivos.activo.value?.nombre ?? null"
      @nuevo="onNuevo"
      @seleccionar="onSeleccionar"
      @renombrar="onRenombrar"
      @borrar="onBorrar"
    />
  </aside>
  <section class="panel-der">
    <BarraEstado
      :diagnosticos="diagnosticos"
      :nombre-activo="archivos.activo.value?.nombre ?? null"
    />
    <EditorCodesmio
      v-if="archivos.activo.value"
      :valor="archivos.activo.value.contenido"
      @actualizar="onEditarContenido"
    />
    <PanelDiagnosticos
      :diagnosticos="diagnosticos"
    />
  </section>
</div>
</template>

<style scoped>
.app-grilla {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: 100vh;
  overflow: hidden;
}
.panel-izq {
  border-right: 1px solid #444;
  background: #1e1e2e;
  color: #ccc;
  display: flex;
  flex-direction: column;
}
.panel-der {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #111;
  color: #eee;
}
.cabecera-app {
  padding: 8px 12px;
  border-bottom: 1px solid #333;
}
.titulo-app {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  opacity: 0.8;
}
</style>
