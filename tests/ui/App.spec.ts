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
   // El H1 del cabecera expone el nombre público de la app. Desde el commit
   // "Textos revisados" (eb7ce17) es "PseudoVálido"; el test se actualizó aquí.
   expect(c.text()).toContain('PseudoVálido')
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

   it('el botón "⚡ Formato" reformatea el contenido del editor', async () => {
     const c = mount(App)
     const ta = c.find('textarea')
     const el = ta.element as HTMLTextAreaElement
      // Contenido sin indentar: una función cuyo cuerpo y un bucle no sangran.
     const desordenado =
        'Funcion f() -> Entero\n' +
        '  resultado = 1\n' +
        'FinFuncion\n' +
        'Algoritmo P\n' +
        'Para i = 1 Mientras i < 3 Hacer\n' +
        'Escribir i\n' +
        'FinPara\n' +
        'FinAlgoritmo\n'
     el.value = desordenado
     await ta.trigger('input')
     await c.get('[data-testid="btn-formato"]').trigger('click')
       await c.vm.$nextTick()
     const valor = (c.find('textarea').element as HTMLTextAreaElement).value
      // El cuerpo del Para ahora sangra 2 espacios.
     expect(valor).toContain('    Escribir i\n')
      // La función y su cierre se mantienen.
     expect(valor).toContain('FinFuncion\n')
        })
     })
