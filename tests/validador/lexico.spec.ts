import { describe, it, expect } from 'vitest'
import { lexear } from '../../src/validador/lexico'

describe('lexer', () => {
    it('tokeniza palabras clave y símbolos con línea/columna 1-indexadas', () => {
      const { tokens } = lexear('Algoritmo Hola // c\nFinAlgoritmo')
      expect(tokens[0].texto).toBe('Algoritmo')
      expect(tokens[0].line).toBe(1)
      expect(tokens[0].column).toBe(1)
      expect(tokens.every((t) => 'line' in t)).toBe(true)
    })

    it('ignora el comentario de línea (el token COMENTARIO no aporta palabras)', () => {
      const { tokens } = lexear('Escribir "x" // comentario')
      const palabras = tokens.filter(
        (t) => t.tipo === 'PALABRA_CLAVE' || t.tipo === 'IDENT'
       )
      expect(palabras.map((t) => t.texto)).toEqual(['Escribir'])
    })

    it('detecta carácter no reconocido como L-001', () => {
      const { errores } = lexear('@')
      expect(errores.length).toBe(1)
      expect(errores[0].code).toBe('L-001')
    })

    it('tokeniza cadenas y caracteres', () => {
      const { tokens } = lexear('"hola" \'-99\' 14.95 25')
      const tipos = tokens.map((t) => t.tipo)
      expect(tipos).toContain('CADENA')
      expect(tipos).toContain('CARACTER')
      expect(tipos).toContain('REAL')
      expect(tipos).toContain('ENTERO')
    })

    it('distingue símbolos de dos caracteres', () => {
      const { tokens } = lexear('a >= b != c && d')
      const s = tokens.filter((t) => t.tipo === 'SIMBOLO').map((t) => t.texto)
      expect(s).toContain('>=')
      expect(s).toContain('!=')
      expect(s).toContain('&&')
    })
  })
