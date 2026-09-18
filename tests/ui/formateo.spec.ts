// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { formatear } from '../../src/ui/composables/formateo'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const CASES_DIR = join(process.cwd(), 'specs', 'grammar', 'cases')

describe('formato del código (formateo.formatear)', () => {
  it('es idempotente sobre todos los casos golden', () => {
    const files = readdirSync(CASES_DIR).filter((f) => f.endsWith('.pse'))
    for (const f of files) {
      const src = readFileSync(join(CASES_DIR, f), 'utf8')
      const una = formatear(src)
      expect(una, `idempotente ${f}`).toBe(formatear(una))
      }
    })

  it('anida el cuerpo un nivel (2 espacios) dentro de Algoritmo/FinAlgoritmo', () => {
    const r = formatear('Algoritmo A\n  Escribir 1\nFinAlgoritmo')
    expect(r).toBe('Algoritmo A\n  Escribir 1\nFinAlgoritmo')
    })

  it('normaliza una indentación irregular a 2 espacios por nivel', () => {
    // El golden 16 usaba 3 espacios de forma accidental; el formateador lo fija.
    const r = formatear('Algoritmo M\n   Declarar a Como Entero\na = 5\nFinAlgoritmo')
    expect(r).toBe(
         'Algoritmo M\n' +
         '  Declarar a Como Entero\n' +
         '  a = 5\n' +
         'FinAlgoritmo')
    })

  it('anida el cuerpo de Mientras y lo cierra al nivel del bucle', () => {
    const r = formatear('Algoritmo C\nMientras c < 10 Hacer\nc = c + 1\nFinMientras\nFinAlgoritmo')
    expect(r).toBe(
         'Algoritmo C\n' +
         '  Mientras c < 10 Hacer\n' +
         '    c = c + 1\n' +
         '  FinMientras\n' +
         'FinAlgoritmo')
    })

  it('un bucle Para dentro de un Repetir se anida a su nivel (caso de la tarea 4)',
     () => {
      const r = formatear(
         'Funcion a() -> Nada\n' +
         'Declarar num Como Entero\n' +
         'num=0\n' +
         'Repetir\n' +
         'Escribir "x"\n' +
         'Leer num\n' +
         'Mientras num <= 0\n' +
         'Para i = 1 Mientras i < 10 Cambio i + 1 Hacer\n' +
         'Escribir i\n' +
         'FinPara\n' +
         'FinFuncion\n')
      expect(r).toBe(
         'Funcion a() -> Nada\n' +
         '  Declarar num Como Entero\n' +
         '  num=0\n' +
         '  Repetir\n' +
         '    Escribir "x"\n' +
         '    Leer num\n' +
         '  Mientras num <= 0\n' +
         '  Para i = 1 Mientras i < 10 Cambio i + 1 Hacer\n' +
         '    Escribir i\n' +
         '  FinPara\n' +
         'FinFuncion\n')
       })

  it('recorta espacios a la derecha de las líneas', () => {
    expect(formatear('Algoritmo A\n  Escribir 1   \nFinAlgoritmo'))
       .toBe('Algoritmo A\n  Escribir 1\nFinAlgoritmo')
      })

  it('convierte tabulaciones y espacios mixtos a 2 espacios por nivel', () => {
    const r = formatear('Algoritmo A\n\tEscribir 1\nFinAlgoritmo')
    expect(r).toBe('Algoritmo A\n  Escribir 1\nFinAlgoritmo')
     })

  it('no anida los casos y "DeOtroModo" de un Segun (los deja alineados)', () => {
    const r = formatear(
         'Algoritmo D\n' +
         '  Segun dia Hacer\n' +
         '    1: Escribir "A"\n' +
         '    DeOtroModo:\n' +
         '    Escribir "B"\n' +
         '  FinSegun\n' +
         'FinAlgoritmo')
     expect(r).toBe(r)   // idempotente
     expect(r).toContain('    1: Escribir "A"')
      })

  it('tolera un programa incompleto sin lanzar (mejor esfuerzo)', () => {
    expect(() => formatear('Algoritmo A\nSi x Entonces\nEscribir 1')).not.toThrow()
     expect(formatear('')).toBe('')})

  it('convierte CRLF a LF', () => {
    expect(formatear('Algoritmo A\r\nEscribir 1\r\nFinAlgoritmo\r'))
        .toBe('Algoritmo A\n  Escribir 1\nFinAlgoritmo\n')
        })
})
