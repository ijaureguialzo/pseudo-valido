// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { parsear } from '../../src/validador/sintactico'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const CASES_DIR = join(process.cwd(), 'specs', 'grammar', 'cases')

describe('parser sintáctico', () => {
   it('parsea bloque Algoritmo/FinAlgoritmo', () => {
     const { ast, errores } = parsear('Algoritmo A\nFinAlgoritmo')
     expect(ast.algoritmo?.t).toBe('algoritmo')
     expect(errores.length).toBe(0)
    })

   it('parsea Si/SiNo/FinSi', () => {
     const { errores } = parsear(
         'Algoritmo A\nSi x > 0 Entonces Escribir "si" SiNo Escribir "no" FinSi\nFinAlgoritmo')
     expect(errores.length).toBe(0)
    })

   it('parsea Mientras/Hacer/FinMientras', () => {
     const { errores } = parsear(
        'Algoritmo A\nMientras c < 10 Hacer c = c + 1\nFinMientras\nFinAlgoritmo')
     expect(errores.length).toBe(0)
    })

   it('parsea Repetir ... Mientras (do-while, sin FinRepetir)', () => {
     const { errores } = parsear(
        'Algoritmo A\nRepetir c = c + 1 Mientras c <= 0\nFinAlgoritmo')
     expect(errores.length).toBe(0)
     expect(errores.findIndex((e) => e.code === 'S-005')).toBe(-1)
    })

   it('parsea Para i=1 Mientras i<10 Cambio i+1 Hacer ... FinPara', () => {
     const { errores } = parsear(
        'Algoritmo A\nPara i = 1 Mientras i < 10 Cambio i + 1 Hacer Escribir i FinPara\nFinAlgoritmo')
     expect(errores.filter((e) => e.code.startsWith('S-')).length).toBe(0)
    })

   it('parsea Funcion f(Definir x Como Entero) -> Entero ... FinFuncion', () => {
     const { ast, errores } = parsear(
        'Funcion f(Definir x Como Entero) -> Entero\n  resultado = x + 1\nFinFuncion\nAlgoritmo A\nFinAlgoritmo')
     expect(ast.funciones.length).toBe(1)
     expect(ast.funciones[0].parametros[0].nombre).toBe('x')
     expect(errores.filter((e) => e.code.startsWith('S-')).length).toBe(0)
    })

   it('falta FinAlgoritmo -> S-002', () => {
     const { errores } = parsear('Algoritmo A')
     expect(errores.some((e) => e.code === 'S-002')).toBe(true)
    })

   it('falta FinSi -> S-004', () => {
     const { errores } = parsear('Algoritmo A\nSi x > 0 Entonces Escribir "x" FinAlgoritmo')
     expect(errores.some((e) => e.code === 'S-004')).toBe(true)
    })

   it('no produce errores de sintaxis en los programas correctos (golden)', () => {
     const files = readdirSync(CASES_DIR).filter((f) => f.endsWith('.pse'))
     for (const f of files) {
       const exp = JSON.parse(
            readFileSync(join(CASES_DIR, f.replace('.pse', '.expected.json')), 'utf8'))
       if (!exp.correcto) continue
       const { errores } = parsear(readFileSync(join(CASES_DIR, f), 'utf8'))
       const sint = errores.filter((e) => e.code.startsWith('S-'))
       expect(sint, `errores S en ${f}`).toEqual([])
      }
    })
})
