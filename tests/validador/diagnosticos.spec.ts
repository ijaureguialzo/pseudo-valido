import { describe, it, expect } from 'vitest'
import * as diag from '../../src/validador/diagnosticos'

describe('diagnosticos', () => {
   it('exporta L-001 como token no reconocido', () => {
      expect(diag.ERRORS['L-001']).toBeDefined()
      expect(diag.ERRORS['L-001'].severity).toBe('error')  
      expect(typeof diag.ERRORS['L-001'].descripcion).toBe('string')
   })

   it('exporta S códigos de sintaxis', () => {
      expect(diag.ERRORS['S-001']).toBeDefined()
      expect(diag.ERRORS['S-002']).toBeDefined()  
      expect(diag.ERRORS['S-003']).toBeDefined()
       // ... S-004 a S-021
   })

   it('exporta M códigos semánticos', () => {  
      expect(diag.ERRORS['M-001']).toBeDefined()
      expect(diag.ERRORS['M-003']).toBeDefined()
       // ... M-005 a M-025
     })

   it('tiene 7 errores léxicos (L-001 a L-006)', () => {  
      const keys = Object.keys(diag.ERRORS)
         .filter(k => k.startsWith('L-'))
         .sort()
      expect(keys).toEqual(['L-001', 'L-002', 'L-003', 'L-004', 'L-005', 'L-006'])  
   })

   it('tiene 22 errores sintácticos (S-001 a S-021, S-322)', () => { 
         const keys = Object.keys(diag.ERRORS)
              .filter(k => k.startsWith('S-'))
              .sort()
         expect(keys.length).toBe(22)    
    })

   it('tiene 25 errores semánticos (M-001 a M-025)', () => {
         const keys = Object.keys(diag.ERRORS)
              .filter(k => k.startsWith('M-'))
              .sort()
         expect(keys.length).toBe(25)
    })

   it('tiene al menos una entrada warning', () => { 
      const entries = Object.values(diag.ERRORS)  
         .filter(e => e.severity === 'warning')
      expect(entries.length).toBeGreaterThan(0)
   })
})
