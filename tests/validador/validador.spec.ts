import { describe, it, expect } from 'vitest'
import { validar } from '../../src/validador'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const CASES_DIR = join(process.cwd(), 'specs', 'grammar', 'cases')

describe('validador: casos golden', () => {
   const files = readdirSync(CASES_DIR).filter((f) => f.endsWith('.pse'))
   for (const f of files) {
     const src = readFileSync(join(CASES_DIR, f), 'utf8')
     const exp = JSON.parse(
          readFileSync(join(CASES_DIR, f.replace('.pse', '.expected.json')), 'utf8'))
     it(`golden ${f}`, () => {
       const r = validar(src)
       expect(r.correcto).toBe(exp.correcto)
       // Código de diagnóstico en orden por (line,column,code).
       const codes = r.diagnosticos.map((d) => d.code)
       expect(codes).toEqual(exp.diagnosticos)
       })
     }
})
