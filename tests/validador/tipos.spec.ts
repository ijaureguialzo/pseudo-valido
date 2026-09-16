// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { Tipo, esNumerico, esBooleano, esTexto, PALABRAS_CLAVE } from '../../src/validador/tipos'
import { getErrorDef, ERRORS } from '../../src/validador/diagnosticos'

describe('tipos de dominio', () => {
  it('esNumerico distingue Entero/Real del resto', () => {
    expect(esNumerico(Tipo.Entero)).toBe(true)
    expect(esNumerico(Tipo.Real)).toBe(true)
    expect(esNumerico(Tipo.Logico)).toBe(false)
    expect(esNumerico(Tipo.Cadena)).toBe(false)
    })

   it('esBooleano solo Logico', () => {
    expect(esBooleano(Tipo.Logico)).toBe(true)
    expect(esBooleano(Tipo.Entero)).toBe(false)
    })

   it('esTexto distingue Cadena/Caracter', () => {
    expect(esTexto(Tipo.Cadena)).toBe(true)
    expect(esTexto(Tipo.Caracter)).toBe(true)
    expect(esTexto(Tipo.Entero)).toBe(false)
    })

   it('PALABRAS_CLAVE contiene las palabras clave del lenguaje', () => {
    expect(PALABRAS_CLAVE.has('Algoritmo')).toBe(true)
    expect(PALABRAS_CLAVE.has('FinMientras')).toBe(true)
    expect(PALABRAS_CLAVE.has('resultado')).toBe(false)
    })
})

describe('tabla de diagnosticos', () => {
  it('getErrorDef devuelve una def existente o null', () => {
   expect(getErrorDef('L-001')).not.toBeNull()
   expect(getErrorDef('L-001')!.descripcion).toBe('Token no reconocido')
   expect(getErrorDef('NO-EXISTS')).toBeNull()
    })

   it('ERRORS contiene las familias L, S y M', () => {
    expect(ERRORS['L-001']).toBeDefined()
    expect(ERRORS['S-001']).toBeDefined()
    expect(ERRORS['M-001']).toBeDefined()
    })
})
