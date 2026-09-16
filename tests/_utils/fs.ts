// Polyfill mínimo de fs/path para vitest en browser environment (happy-dom).
// Proporciona versiones funcionales de readFileSync, readdirSync y join.
import type { Dirent } from 'node:fs'

export function join(...parts: string[]): string {
  return parts.filter(Boolean).join('/')
}

const CASES_BASE = '../../specs/grammar/cases'

export const CASES_DIR = join(import.meta.url.split('/').slice(0, -2).join('/'), 'specs', 'grammar', 'cases')

class MockDirent implements Dirent {
  name: string
  isFile(): boolean { return true }
  isDirectory(): boolean { return false }
  constructor(public name: string) {}
}

export function readdirSync(dir: string): string[] {
  // En browser no tenemos acceso directo al filesystem desde vitest.
  // Esta función se sobrescribe en el setup con datos reales.
  return []
}

export function readFileSync(path: string, encoding: 'utf8' = 'utf8'): string {
  return ''
}
