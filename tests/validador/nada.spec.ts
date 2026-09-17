// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { validar } from '../../src/validador'

// Tipo de retorno `Nada` + prohibición de `resultado` (M-026).
// G-01 §4.3 M-026, D8 (funciones sin retorno).
describe('funciones con tipo de retorno Nada (M-026)', () => {
  it('función -> Nada sin usar resultado es correcta', () => {
    const r = validar(
         'Funcion impr() -> Nada\n' +
         '  Escribir "Hola"\n' +
         'FinFuncion\n' +
         'Algoritmo P\n' +
         '  Escribir 1\n' +
          'FinAlgoritmo')
    expect(r.diagnosticos.length).toBe(0)
    expect(r.correcto).toBe(true)
       })

  it('asignar a resultado en -> Nada da M-026', () => {
    const r = validar(
         'Funcion impr() -> Nada\n' +
         '  resultado = 1\n' +
          'FinFuncion\n' +
          'Algoritmo P\nFinAlgoritmo')
    expect(r.diagnosticos.map((d) => d.code)).toContain('M-026')
    expect(r.correcto).toBe(false)
      })

   it('usar resultado en expresión en -> Nada da M-026', () => {
    const r = validar(
          'Funcion impr() -> Nada\n' +
          '  Escribir resultado\n' +
          'FinFuncion\n' +
          'Algoritmo P\nFinAlgoritmo')
    expect(r.diagnosticos.map((d) => d.code)).toContain('M-026')
    expect(r.correcto).toBe(false)
      })

   it('declarar resultado Como ... en -> Nada da M-026', () => {
    const r = validar(
          'Funcion impr() -> Nada\n' +
          '  Declarar resultado Como Entero\n' +
          'FinFuncion\n' +
          'Algoritmo P\nFinAlgoritmo')
    expect(r.diagnosticos.map((d) => d.code)).toContain('M-026')
    expect(r.correcto).toBe(false)
      })

   it('resultado NO está prohibido en una función con tipo de retorno real', () => {
    const r = validar(
          'Funcion suma(Declarar x Como Entero) -> Entero\n' +
          '  resultado = x + 1\n' +
          'FinFuncion\n' +
          'Algoritmo P\n' +
          '  Escribir 1\n' +
          'FinAlgoritmo')
    expect(r.diagnosticos.filter((d) => d.code === 'M-026').length).toBe(0)
    expect(r.correcto).toBe(true)
      })

   it('"Nada" es un tipo aceptado por expectTipo (no M-005)', () => {
    const r = validar('Funcion f() -> Nada\nFinFuncion\nAlgoritmo P\nFinAlgoritmo')
    expect(r.diagnosticos.filter((d) => d.code === 'M-005').length).toBe(0)
    expect(r.correcto).toBe(true)
     })

   it('llamada solitaria a una función -> Nada es una sentencia correcta (caso de la tarea)', () => {
    // menu() usada por sus efectos, sin recoger resultado: es la forma natural
    // de invocar una función que no devuelve valor. Valorable tanto antes como
    // después del Algoritmo.
    const r = validar(
      'Algoritmo Prueba\n' +
      '  menu()\n' +
      'FinAlgoritmo\n' +
      '\n' +
      'Funcion menu() -> Nada\n' +
      '  Escribir "Hola"\n' +
      'FinFuncion\n')
    expect(r.diagnosticos.length).toBe(0)
    expect(r.correcto).toBe(true)
     })

   it('la llamada solitaria se valida semánticamente (nº de argumentos -> M-013)', () => {
    // El nodo de sentencia 'llamada' recorre revisarExpr: un número de
    // argumentos errado sigue disparando M-013.
    const r = validar(
      'Funcion menu(Declarar x Como Entero) -> Nada\n' +
      '  Escribir x\n' +
      'FinFuncion\n' +
      'Algoritmo P\n' +
      '  menu(1, 2)\n' +
      'FinAlgoritmo')
    expect(r.diagnosticos.map((d) => d.code)).toContain('M-013')
     })

   it('una llamada solitaria a función no definida da M-012', () => {
    const r = validar('Algoritmo P\n  nada()\nFinAlgoritmo')
    expect(r.diagnosticos.map((d) => d.code)).toContain('M-012')
       })
 })
