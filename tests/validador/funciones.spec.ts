// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { validar } from '../../src/validador'

// Comportamiento fijado en G-01 (D-alcance / D-redef / M-009 estricto):
// (1) un argumento Real NO cabe en un parámetro Entero: dispara M-009.
// (2) el ámbito de un parámetro es la propia función: en el programa principal,
//     usar `a`/`b` (parámetros de `sumar`) sin declararlas dispara M-001.
// (3) una función NO puede declararse dos veces con el mismo nombre: dispara M-025.
describe('funciones: tipos de llamada, alcance y redefinición (deben fallar)', () => {
  it('P1: argumento Real frente a parámetro Entero dispara M-009', () => {
    const r = validar(
         'Funcion sumar(Declarar a Como Entero, Declarar b Como Entero) -> Entero\n' +
         'resultado = a + b\n' +
         'FinFuncion\n' +
         'Algoritmo Prueba\n' +
         'Declarar x Como Entero\n' +
         'x = sumar(5, 5.7)\n' +
          'FinAlgoritmo')
    expect(r.correcto).toBe(false)
    expect(r.diagnosticos.map((d) => d.code)).toContain('M-009')
      })

  it('P1.b: argumento Entero frente a parámetro Entero NO dispara M-009 (coincidente)', () => {
    const r = validar(
         'Funcion sumar(Declarar a Como Entero, Declarar b Como Entero) -> Entero\n' +
         'resultado = a + b\n' +
         'FinFuncion\n' +
         'Algoritmo Prueba\n' +
         'Declarar x Como Entero\n' +
         'x = sumar(5, 5)\n' +
          'FinAlgoritmo')
    expect(r.correcto).toBe(true)
    expect(r.diagnosticos.length).toBe(0)
      })

  it('P2: parámetros de función NO visibles en el principal (sumar(a,b) da M-001)', () => {
    const r = validar(
         'Funcion sumar(Declarar a Como Entero, Declarar b Como Entero) -> Entero\n' +
         'resultado = a + b\n' +
         'FinFuncion\n' +
         'Algoritmo Prueba\n' +
         'Declarar x Como Entero\n' +
         'x = sumar(a, b)\n' +
          'FinAlgoritmo')
    expect(r.correcto).toBe(false)
    const codes = r.diagnosticos.map((d) => d.code)
    expect(codes).toContain('M-001')
     // Los dos argumentos `a` y `b` no están declarados en el programa principal.
    expect(codes.filter((c) => c === 'M-001').length).toBe(2)
      })

  it('P2.b: dentro de su propia definición, el parámetro SÍ está en alcance', () => {
     // Dentro del cuerpo de `sumar`, `a` y `b` son variables locales válidas.
    const r = validar(
         'Funcion sumar(Declarar a Como Entero, Declarar b Como Entero) -> Entero\n' +
         'resultado = a + b\n' +
         'FinFuncion\n' +
         'Algoritmo Prueba\n' +
         'FinAlgoritmo')
    expect(r.correcto).toBe(true)
    expect(r.diagnosticos.filter((d) => d.code === 'M-001').length).toBe(0)
      })

  it('P3: redefinir una función ya declarada dispara M-025', () => {
    const r = validar(
         'Funcion sumar(Declarar a Como Entero, Declarar b Como Entero) -> Entero\n' +
         'resultado = a + b\n' +
         'FinFuncion\n' +
         'Funcion sumar(Declarar a Como Entero, Declarar b Como Entero) -> Entero\n' +
         'resultado = a + b\n' +
         'FinFuncion\n' +
         'Algoritmo Prueba\n' +
         'Declarar x Como Entero\n' +
         'x = sumar(5, 5)\n' +
          'FinAlgoritmo')
    expect(r.correcto).toBe(false)
    expect(r.diagnosticos.map((d) => d.code)).toContain('M-025')
      })
 })
