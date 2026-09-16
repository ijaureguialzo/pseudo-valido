import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EditorCodesmio from '../../src/ui/componentes/EditorCodesmio.vue'

describe('EditorCodesmio', () => {
   it('muestra un <textarea> como fallback cuando no está configurado CodeMirror', () => {
      const contenido = 'Algoritmo Hola\nEscribir "Hola mundo"\nFinAlgoritmo'
      const c = mount(EditorCodesmio, {
         props: { valor: contenido },
      })
      expect(c.find('textarea').exists()).toBe(true)
   })

   it('muestra el contenido inicial del archivo', () => {
      const texto = 'Declarar x Como Entero\nx <- 5\nEscribir x'
      const c = mount(EditorCodesmio, {
         props: { valor: texto },
      })
      // El textarea debe contener el texto pasado en la prop
      expect(c.find('textarea').element?.value).toBe(texto)
   })

   it('emite "actualizar" cuando se escribe nuevo contenido', async () => {
      const contenido = 'Algoritmo Test\nFinAlgoritmo'
      const c = mount(EditorCodesmio, {
         props: { valor: contenido },
      })
      await c.find('textarea').setValue('Programa Nuevo\nFinPrograma')
      expect(c.emitted('actualizar')).toBeTruthy()
      const emites = (c.emitted('actualizar') as string[][])
      expect(emites[emites.length - 1][0]).toBe('Programa Nuevo\nFinPrograma')
   })

   it('tiene clase CSS "editor-codigo" en el contenedor raíz', () => {
      const c = mount(EditorCodesmio, { props: { valor: '' } })
      expect(c.find('.editor-codigo').exists()).toBe(true)
   })
})
