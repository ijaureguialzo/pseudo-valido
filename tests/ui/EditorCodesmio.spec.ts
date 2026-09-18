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

   it('Tab sangra líneas completas seleccionadas', async () => {
       // Seleccionar las líneas 'b' y 'c' (incluyendo sus saltos) las sangra
       // ambas; la línea 'a' y las siguientes no tocan.
     const texto = 'a\nb\nc\nd\ne\n'
     const c = mount(EditorCodesmio, { props: { valor: texto } })
     const ta = c.find('textarea')
     const el = ta.element as HTMLTextAreaElement
        // 'b' y 'c' con sus saltos: desde tras 'a\n' (pos 2) hasta tras 'c\n' (pos 6).
     el.selectionStart = 2
     el.selectionEnd = 6
      await ta.trigger('keydown', { key: 'Tab' })
      const nuevo = (c.emitted('actualizar') as string[][]).at(-1)![0]
       expect(nuevo).toBe('a\n  b\n  c\nd\ne\n')
       expect(el.selectionStart).toBe(4)
       expect(el.selectionEnd).toBe(10)
             // Solo 'b' y 'c' ganan 2 espacios de sangría; 'a' y 'd' no se tocan.
       expect(nuevo.split('\n').filter((l) => l.startsWith('  '))).toEqual(['  b', '  c'])
              })

    it('Cursor al inicio de una línea: Tab sangra esa línea (no inserta una nueva)', async () => {
       // Regresión del síntoma 2: con el cursor pegado al inicio de la línea
       // (posición justo tras el salto anterior) y sin selección, pulsar Tab
       // debe sangrar LA línea, no intercalar una línea vacía delante de ella.
     const texto = 'abc\ndef'
     const c = mount(EditorCodesmio, { props: { valor: texto } })
     const ta = c.find('textarea')
     const el = ta.element as HTMLTextAreaElement
        // El cursor tras el '\n' de 'abc' (posición 4), justo al inicio de 'def'.
     el.selectionStart = 4
     el.selectionEnd = 4
      await ta.trigger('keydown', { key: 'Tab' })
     const nuevo = (c.emitted('actualizar') as string[][]).at(-1)![0]
      expect(nuevo).toBe('abc\n  def')          // sangra 'def'; no hay línea nueva
      expect(nuevo.split('\n').length).toBe(2)  // siguen siendo 2 líneas
      expect(el.selectionStart).toBe(6)         // el cursor se mueve tras la sangría
      expect(el.selectionEnd).toBe(6)
          })

    it('Cursor al inicio de una línea: Shift+Tab desangra esa línea', async () => {
     const texto = 'abc\n  def'
     const c = mount(EditorCodesmio, { props: { valor: texto } })
     const ta = c.find('textarea')
     const el = ta.element as HTMLTextAreaElement
     el.selectionStart = 4
     el.selectionEnd = 4
      await ta.trigger('keydown', { key: 'Tab', shiftKey: true })
     const nuevo = (c.emitted('actualizar') as string[][]).at(-1)![0]
      expect(nuevo).toBe('abc\ndef')
      expect(nuevo.split('\n').length).toBe(2) // no desaparece ninguna línea
      expect(el.selectionStart).toBe(4)
      expect(el.selectionEnd).toBe(4)
          })

    it('Shift+Tab desangra líneas completas seleccionadas', async () => {
     const texto = 'a\n  b\n  c\nd\ne\n'
     const c = mount(EditorCodesmio, { props: { valor: texto } })
     const ta = c.find('textarea')
     const el = ta.element as HTMLTextAreaElement
       // 'b' y 'c' con sus saltos (2 espacios de sangría): tras 'a\n' (pos 2) a tras 'c\n' (pos 8).
     el.selectionStart = 2
     el.selectionEnd = 8
      await ta.trigger('keydown', { key: 'Tab', shiftKey: true })
     const nuevo = (c.emitted('actualizar') as string[][]).at(-1)![0]
      expect(nuevo).toBe('a\nb\nc\nd\ne\n')
      expect(el.selectionStart).toBe(2)
      expect(el.selectionEnd).toBe(4)
          })

    it('Tab no extiende la selección hasta el final del archivo', async () => {
     const texto = 'una\n  dos\n  tres\n  cuatro\n  cinco\n'
     const c = mount(EditorCodesmio, { props: { valor: texto } })
     const ta = c.find('textarea')
     const el = ta.element as HTMLTextAreaElement
             // Selecciona la línea 'dos' (completa, con su salto): tras 'una\n' (pos 4) hasta tras 'dos\n' (pos 8).
     el.selectionStart = 4
     el.selectionEnd = 8
     await ta.trigger('keydown', { key: 'Tab' })
     const nuevo = (c.emitted('actualizar') as string[][]).at(-1)![0]
            // La selección no corre al final del archivo, y solo 'dos' gana sangría.
     expect(el.selectionEnd).toBeLessThan(texto.length)
     expect(nuevo).toBe('una\n    dos\n  tres\n  cuatro\n  cinco\n')
            })

    it('Shift+Tab no extiende la selección hasta el final', async () => {
     const texto = 'una\n  dos\n  tres\n  cuatro\n'
     const c = mount(EditorCodesmio, { props: { valor: texto } })
     const ta = c.find('textarea')
     const el = ta.element as HTMLTextAreaElement
       // 'dos' y 'tres' completos: tras 'una\n' (pos 4) hasta tras 'tres\n' (pos 8).
     el.selectionStart = 4
     el.selectionEnd = 8
     await ta.trigger('keydown', { key: 'Tab', shiftKey: true })
     const nuevo = (c.emitted('actualizar') as string[][]).at(-1)![0]
        expect(el.selectionEnd).toBeLessThan(nuevo.length)
     expect(nuevo).toBe('una\ndos\n  tres\n  cuatro\n')
            })
     })
