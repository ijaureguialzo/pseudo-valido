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

   it('Tab sangra el cursor 2 espacios (sin selección)', async () => {
     const c = mount(EditorCodesmio, { props: { valor: '' } })
     const ta = c.find('textarea')
     const el = ta.element as HTMLTextAreaElement
     el.selectionStart = 0
     el.selectionEnd = 0
     await ta.trigger('keydown', { key: 'Tab' })
     expect(c.emitted('actualizar')).toBeTruthy()
     const ult = c.emitted('actualizar')![c.emitted('actualizar')!.length - 1][0]
      expect(ult).toBe('  ') // 2 espacios añadidos al inicio de la única línea
        })

   it('Tab sangra un bloque seleccionado entero', async () => {
     const texto = 'a\nb\nc\n'
     const c = mount(EditorCodesmio, { props: { valor: texto } })
     const ta = c.find('textarea')
     const el = ta.element as HTMLTextAreaElement
         // Selecciona de la línea 'a' hasta la línea 'b' (incluye el salto).
     el.selectionStart = 1
     el.selectionEnd = 3
     await ta.trigger('keydown', { key: 'Tab' })
     const ult = c.emitted('actualizar')![c.emitted('actualizar')!.length - 1][0]
      expect(ult).toBe('  a\n  b\nc\n')   // sangría 2 espacios para las líneas 0-1
         })

   it('Shift+Tab desangra un bloque (retira 2 espacios de cada línea)', async () => {
     const texto = 'a\n  b\n  c\n'     // 2 espacios de sangría en b y c
     const c = mount(EditorCodesmio, { props: { valor: texto } })
     const ta = c.find('textarea')
     const el = ta.element as HTMLTextAreaElement
         // Se selecciona desde después de 'a' hasta el final de la línea 'c'.
       el.selectionStart = 1
     el.selectionEnd = 8
      await ta.trigger('keydown', { key: 'Tab', shiftKey: true })
     const ult = c.emitted('actualizar')![c.emitted('actualizar')!.length - 1][0]
     expect(ult).toBe('a\nb\nc\n')
    })

   // Regresión: Tab no debe EXTENDER la selección hasta el final del archivo.
   // Se elige un bloque en el MEDIO de un documento; tras indentar, la selección
   // debe conservar su contenido y quedarse dentro de la zona, no correr al EOF.
  it('Tab mantiene la selección (no la extiende hasta el final del archivo)', async () => {
    const texto = 'una\n  dos\n  tres\n  cuatro\n  cinco\n'
    const c = mount(EditorCodesmio, { props: { valor: texto } })
    const ta = c.find('textarea')
    const el = ta.element as HTMLTextAreaElement
        // Selecciona las líneas 'dos' y 'tres' (no las finales).
    el.selectionStart = 5
    el.selectionEnd = 12
    await ta.trigger('keydown', { key: 'Tab' })
       // La nueva selección sigue siendo un rango reducido, NO hasta el final.
    expect(el.selectionEnd).toBeLessThanOrEqual(18)
     expect(el.selectionEnd).toBeLessThan(texto.length)
       // El contenido de la selección no cambia (se sangraron 2 líneas de 2 espacios).
    expect(el.value.length).toBe(texto.length + 4)
       })

   it('Shift+Tab mantiene la selección (no la extiende hasta el final)', async () => {
    const texto = 'una\n  dos\n  tres\n  cuatro\n'
    const c = mount(EditorCodesmio, { props: { valor: texto } })
    const ta = c.find('textarea')
    const el = ta.element as HTMLTextAreaElement
     el.selectionStart = 5
     el.selectionEnd = 10
    await ta.trigger('keydown', { key: 'Tab', shiftKey: true })
       expect(el.selectionEnd).toBeLessThanOrEqual(10)
     expect(el.selectionEnd).toBeLessThan(texto.length + 5)
       })
})
