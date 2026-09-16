import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PanelDiagnosticos from '../../src/ui/componentes/PanelDiagnosticos.vue'
import BarraEstado from '../../src/ui/componentes/BarraEstado.vue'

describe('PanelDiagnosticos', () => {
   it('muestra OK cuando no hay diagnosticos', () => {
     const c = mount(PanelDiagnosticos, {
       props: { diagnosticos: [] } })
     expect(c.find('[data-testid="ok"]').exists()).toBe(true)
     expect(c.find('.errores').exists()).toBe(false)
     })

   it('lista M-001 con línea y columna', () => {
     const c = mount(PanelDiagnosticos, {
       props: {
         diagnosticos: [
            { line: 3, column: 5, message: "Variable 'x' no declarada", code: 'M-001',  severity: 'error' }
             ] } })
     expect(c.find('[data-code="M-001"]').exists()).toBe(true)
     expect(c.text()).toContain('L3')
     expect(c.text()).toContain('C5')
     expect(c.text()).toContain("Variable 'x' no declarada")
     })
})

describe('BarraEstado', () => {
   it('muestra OK cuando no hay errores', () => {
     const c = mount(BarraEstado, { props: { diagnosticos: [], nombreActivo: 'a.pse' } })
     expect(c.text()).toContain('OK')
     expect(c.text()).toContain('a.pse')
     })

   it('muestra N errores y M avisos', () => {
     const c = mount(BarraEstado, {
       props: {
         diagnosticos: [
            { line: 1, column: 1, message: 'e1', code: 'M-001', severity: 'error' },
            { line: 2, column: 3, message: 'w', code: 'M-018', severity: 'warning' }
             ],
         nombreActivo: null
          } })
     expect(c.text()).toContain('1 error')
     expect(c.text()).toContain('1 aviso')
     })
})
