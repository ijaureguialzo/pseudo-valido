// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { validar } from '../../src/validador'

// Suite que ejercita las ramas del checker semántico (M-xxx) y la inferencia
// de tipos. Complementa a golden con casos puntuales para la rama.
function codigos(src: string): string[] {
  return validar(src).diagnosticos.map((d) => d.code)
}

describe('checker semántico', () => {
  it('M-001 variable no declarada', () => {
   expect(codigos('Algoritmo A\nEscribir x\nFinAlgoritmo'))
      .toContain('M-001')
   })

  it('M-001 asignación a variable no declarada', () => {
   // El LHS de = no está declarado: `a = 7`.
   const r = validar('Algoritmo Prueba\na = 7\nFinAlgoritmo')
   expect(r.diagnosticos.map((d) => d.code)).toEqual(['M-001'])
   expect(r.correcto).toBe(false)
   })

  it('M-001 no se dispara al asignar variable declarada', () => {
   const r = validar('Algoritmo Prueba\nDeclarar a Como Entero\na = 7\nFinAlgoritmo')
   expect(r.diagnosticos.filter((d) => d.code === 'M-001').length).toBe(0)
   expect(r.correcto).toBe(true)
   })

  it('M-004 Leer sobre variable no declarada', () => {
   const r = validar('Algoritmo Prueba\nLeer a\nFinAlgoritmo')
   expect(r.diagnosticos.map((d) => d.code)).toEqual(['M-004'])
   expect(r.correcto).toBe(false)
   })

  it('M-004 no se dispara al leer variable declarada', () => {
   const r = validar('Algoritmo Prueba\nDeclarar a Como Entero\nLeer a\nFinAlgoritmo')
   expect(r.diagnosticos.filter((d) => d.code === 'M-004').length).toBe(0)
   })

  it('M-002 declaración duplicada', () => {
    expect(codigos('Algoritmo A\nDeclarar x Como Entero\nDeclarar x Como Entero\nFinAlgoritmo'))
      .toContain('M-002')
   })

   it('M-003 uso antes de inicializar', () => {
    expect(codigos('Algoritmo A\nDeclarar y Como Entero\nEscribir y\nFinAlgoritmo'))
      .toContain('M-003')
   })

   it('M-010 operador lógico sobre no-lógico', () => {
    expect(codigos('Algoritmo A\nDeclarar a Como Entero\nDeclarar b Como Entero\nEscribir a && b\nFinAlgoritmo'))
      .toContain('M-010')
   })

   it('M-012 llamada a función no definida', () => {
    expect(codigos('Algoritmo A\nEscribir foo(2)\nFinAlgoritmo'))
      .toContain('M-012')
   })

   it('M-015 recursión no declarada', () => {
    expect(
     codigos('Funcion f(Definir x Como Entero) -> Entero\nresultado = f(x)\nFinFuncion\nAlgoritmo A\nFinAlgoritmo'))
      .toContain('M-015')
   })

   it('M-018 Para sin Cambio (warning)', () => {
    const r = validar('Algoritmo A\nDeclarar i Como Entero\ni = 1\nPara i = 1 Mientras i < 10 Hacer Escribir i FinPara\nFinAlgoritmo')
    const w = r.diagnosticos.find((d) => d.code === 'M-018')
    expect(w).toBeDefined()
    expect(w?.severity).toBe('warning')
    expect(r.correcto).toBe(true)
   })

   it('tipos: concatenación de cadenas infiere Cadena', () => {
    // Dos cadenas con + deben inferir Cadena (sin M-019/020).
    const r = validar('Algoritmo A\nEscribir "a" + "b"\nFinAlgoritmo')
    expect(r.diagnosticos.filter((d) => d.code === 'M-019').length).toBe(0)
   })

   it('operación numérica válida en Entero no produce M-019', () => {
    const r = validar('Algoritmo A\nDeclarar a Como Entero\nDeclarar b Como Entero\na = 5\nb = a + 1\nEscribir b\nFinAlgoritmo')
    expect(r.diagnosticos.filter((d) => d.code === 'M-019').length).toBe(0)
    expect(r.correcto).toBe(true)
   })

   it('programa correcto -> 0 errores', () => {
    const r = validar('Algoritmo Hola\nEscribir "Hola mundo"\nFinAlgoritmo')
    expect(r.diagnosticos.filter((d) => d.severity === 'error').length).toBe(0)
    expect(r.correcto).toBe(true)
    })
})
