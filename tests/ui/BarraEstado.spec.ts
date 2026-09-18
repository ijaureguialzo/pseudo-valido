import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BarraEstado from '../../src/ui/componentes/BarraEstado.vue'

describe('BarraEstado: botón de formato', () => {
  it('muestra el botón discreto de formato junto al mensaje de estado', () => {
     const c = mount(BarraEstado, {
        props: { diagnosticos: [], nombreActivo: 'prueba.pse' },
     })
     const btn = c.get('[data-testid="btn-formato"]')
     expect(btn.exists()).toBe(true)
    expect(btn.attributes('disabled')).toBeUndefined()
     expect(c.get('[data-testid="estado"]').text()).toBe('OK')
       })

  it('el botón queda deshabilitado cuando no hay archivo abierto', () => {
    const c = mount(BarraEstado, {
       props: { diagnosticos: [], nombreActivo: null },
     })
     expect(c.get('[data-testid="btn-formato"]').attributes('disabled')).toBeDefined()
       })

  it('al pulsarlo emite "formatear"', async () => {
    const c = mount(BarraEstado, {
       props: { diagnosticos: [], nombreActivo: 'prueba.pse' },
     })
    await c.get('[data-testid="btn-formato"]').trigger('click')
     expect(c.emitted('formatear')).toBeTruthy()
      })

  it('no emite "formatear" si el botón está deshabilitado', async () => {
    const c = mount(BarraEstado, {
       props: { diagnosticos: [], nombreActivo: null },
     })
    await c.get('[data-testid="btn-formato"]').trigger('click')
     expect(c.emitted('formatear')).toBeUndefined()
     })
})
