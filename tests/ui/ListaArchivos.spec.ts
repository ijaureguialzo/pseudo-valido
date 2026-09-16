import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ListaArchivos from '../../src/ui/componentes/ListaArchivos.vue'

describe('ListaArchivos', () => {
   it('muestra la lista y emite seleccionar', async () => {
     const c = mount(ListaArchivos, {
       props: {
         archivos: [{ nombre: 'hola.pse', contenido: '' }, { nombre: 'x', contenido: '' }],
         activo: 'hola.pse',
         }
       })
     expect(c.text()).toContain('hola.pse')
     expect(c.text()).toContain('x')
     await c.get('[data-archivo-name="x"]').trigger('click')
     expect(c.emitted('seleccionar')![0]).toEqual(['x'])
     })

   it('boton Nuevo emite "nuevo"', async () => {
     const c = mount(ListaArchivos, {
       props: { archivos: [], activo: null } })
     await c.get('[data-testid="btn-nuevo"]').trigger('click')
     expect(c.emitted('nuevo')).toBeTruthy()
     })
})
