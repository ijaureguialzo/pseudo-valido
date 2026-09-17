// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { validar } from '../../src/validador'

// Ejercicio de las tres reglas que la petición de 2026-09-17 pidió corregir:
// (1) un argumento Real encaja en un parámetro Entero (compatibilidad numérica,
//     no M-009); (2) los parámetros de una función están visibles en el programa
//     principal, por lo que una llamada `sumar(a, b)` con `a`/`b` sin declarar
//     localmente NO dispara M-001; (3) redefinir una función con un nombre ya
//     usado NO dispara error de duplicada.
describe('funciones: tipos de llamada, alcance y redefinición', () => {
  it('P1: argumento Real frente a parámetro Entero no dispara M-009', () => {
    const r = validar(
        'Funcion sumar(Declarar a Como Entero, Declarar b Como Entero) -> Entero\n' +
        'resultado = a + b\n' +
        'FinFuncion\n' +
        'Algoritmo Prueba\n' +
        'Declarar x Como Entero\n' +
        'x = sumar(5, 5.7)\n' +
         'FinAlgoritmo')
    expect(r.diagnosticos.filter((d) => d.code === 'M-009').length).toBe(0)
    expect(r.correcto).toBe(true)
    })

  it('P2: parámetros de función visibles en el principal (sin M-001)', () => {
    const r = validar(
        'Funcion sumar(Declarar a Como Entero, Declarar b Como Entero) -> Entero\n' +
        'resultado = a + b\n' +
        'FinFuncion\n' +
        'Algoritmo Prueba\n' +
        'Declarar x Como Entero\n' +
        'x = sumar(a, b)\n' +
         'FinAlgoritmo')
    expect(r.diagnosticos.filter((d) => d.code === 'M-001').length).toBe(0)
    expect(r.correcto).toBe(true)
    })

  it('P3: redefinir una función ya declarada no dispara error de duplicada', () => {
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
    expect(r.diagnosticos.length).toBe(0)
    expect(r.correcto).toBe(true)
     })
 })
