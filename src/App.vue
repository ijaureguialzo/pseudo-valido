<script setup lang="ts">
import { computed } from 'vue'
import ListaArchivos from './ui/componentes/ListaArchivos.vue'
import EditorCodesmio from './ui/componentes/EditorCodesmio.vue'
import PanelDiagnosticos from './ui/componentes/PanelDiagnosticos.vue'
import BarraEstado from './ui/componentes/BarraEstado.vue'
import { useArchivos, type Archivo } from './ui/composables/useArchivos'
import { useValidacion } from './ui/composables/useValidacion'
import { useTema } from './ui/composables/useTema'
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

// Control de tema (auto / claro / oscuro).
const tema = useTema()
function onCambioTema(evt: Event): void {
  const value = (evt.target as HTMLSelectElement).value as 'auto' | 'claro' | 'oscuro'
  tema.elegir(value)
}

// Manejadores para listar/renombrar/borrar
function onNuevo(): void {
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
      <header class="cabecera-app">
        <h1 class="titulo-app">
          PseudoVálido
        </h1>
        <label class="control-tema">
          <span>Tema</span>
          <select
            class="selector-tema"
            data-testid="selector-tema"
            :value="tema.modo.value"
            @change="onCambioTema"
          >
            <option value="auto">Auto</option>
            <option value="claro">Claro</option>
            <option value="oscuro">Oscuro</option>
          </select>
        </label>
      </header>
      <ListaArchivos
        class="lista"
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
        class="barra-estado"
        :diagnosticos="diagnosticos"
        :nombre-activo="archivos.activo.value?.nombre ?? null"
      />
      <EditorCodesmio
        v-if="archivos.activo.value"
        class="editor"
        :valor="archivos.activo.value.contenido"
        @actualizar="onEditarContenido"
      />
      <PanelDiagnosticos
        class="panel-diagnosticos"
        :diagnosticos="diagnosticos"
      />
    </section>
  </div>
</template>

<style scoped>
/* El framework Pico define la base (tipografía, tokens y modo claro/oscuro).
   La capa de tokens de la app (--pv-*, en src/estilo/tema.css) hace de puente
   entre Pico y la presentación, de modo que el modo claro/oscuro es uniforme. */
.app-grilla {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: 100%;
  overflow: hidden;
}

.panel-izq {
  display: flex;
  flex-direction: column;
  background: var(--pv-surface-secondary);
  border-right: 1px solid var(--pv-border);
}

.panel-der {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--pv-surface);
}

.cabecera-app {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin: 0;
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--pv-border);
}

.titulo-app {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  font-family: var(--pico-font-family);
  color: var(--pv-text);
}

.control-tema {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-family: var(--pico-font-family);
  color: var(--pv-text-muted);
}

.selector-tema {
  display: inline-block;
  width: auto;
  min-height: 0;
  height: 1.9rem;
  padding: 0 0.4rem;
  margin: 0;
  font-family: var(--pico-font-family);
  font-size: 0.8rem;
  font-weight: 400;
  line-height: 1;
  color: var(--pv-text);
  background: var(--pv-surface);
  border: 1px solid var(--pv-border);
  border-radius: 0.25rem;
  -webkit-appearance: none;
  appearance: none;
}

@media (max-width: 768px) {
   .app-grilla {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
   }
   .panel-izq {
    border-right: none;
    border-bottom: 1px solid var(--pv-border);
   }
}

</style>
