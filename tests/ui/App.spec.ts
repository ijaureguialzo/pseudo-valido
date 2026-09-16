/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'
import ListaArchivos from '../../src/ui/componentes/ListaArchivos.vue'
import EditorCodesmio from '../../src/ui/componentes/EditorCodesmio.vue'
import PanelDiagnosticos from '../../src/ui/componentes/PanelDiagnosticos.vue'
import BarraEstado from '../../src/ui/componentes/BarraEstado.vue'

describe('App.vue', () => {
  it('monta y muestra el título', () => {
   const c = mount(App)
   expect(c.text()).toContain('pseudo-valido')
   })

   it('ensambla el panel izquierdo (lista de archivos)', () => {
     const c = mount(App)
     expect(c.findComponent(ListaArchivos).exists()).toBe(true)
     })

   it('ensambla el editor de código a la derecha', () => {
     const c = mount(App)
     expect(c.findComponent(EditorCodesmio).exists()).toBe(true)
     })

   it('muestra el panel de diagnósticos y la barra de estado', () => {
     const c = mount(App)
     expect(c.findComponent(PanelDiagnosticos).exists()).toBe(true)
     expect(c.findComponent(BarraEstado).exists()).toBe(true)
     })
})
