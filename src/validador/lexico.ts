import {
    Token,
    TipoToken,
    Diagnostico,
    PALABRAS_CLAVE
 } from './tipos'

// Orden de prioridad para símbolos de dos caracteres.
const SIMBOLOS_DOS = new Set([
   '->', '&&', '||', '>=', '<=', '==', '!='
 ])
const SIMBOLOS_UNO = new Set([
   '+', '-', '*', '/', '%', '=', '<', '>', '(', ')', ',', ':'
 ])

// Devuelve los tokens y los errores léxicos. Los comentarios se emiten como
// COMENTARIO para preservar lineas; el parser los ignora.
export function lexear(texto: string): { tokens: Token[]; errores: Diagnostico[] } {
   const tokens: Token[] = []
   const errores: Diagnostico[] = []
   let i = 0
   let linea = 1
   let columna = 1
   const n = texto.length

   while (i < n) {
     const c = texto[i]

     // Salto de línea
     if (c === '\n') {
       linea++
       columna = 1
       i++
       continue
     }
     // Espacios / tabulaciones
     if (c === ' ' || c === '\t') {
       i++
       columna++
       continue
     }

     // Comentario
     if (c === '/' && texto[i + 1] === '/') {
       const inicio = columna
       i += 2
       columna += 2
       while (i < n && texto[i] !== '\n') {
         i++
         columna++
       }
       tokens.push({ tipo: 'COMENTARIO', texto: texto.slice(0, 0), line: linea, column: inicio })
       continue
     }

     // Cadena con comillas dobles
     if (c === '"') {
       const inicio = i
       const col = columna
       i++
       columna++
       let contenido = ''
       let sinCierre = false
       while (i < n && texto[i] !== '"') {
         if (texto[i] === '\n') {
           sinCierre = true
           break
         }
         contenido += texto[i]
         i++
         columna++
       }
       if (sinCierre) {
         errores.push(mk('L-003', `Cadena sin cerrar`, linea, col))
       }
       if (!sinCierre && texto[i] === '"') {
         i++
         columna++
       }
       tokens.push({ tipo: 'CADENA', texto: contenido, line: linea, column: col })
       continue
     }

     // Caracter con comillas simples
     if (c === "'") {
       const col = columna
       i++
       columna++
       let contenido = ''
       let sinCierre = false
       while (i < n && texto[i] !== "'") {
         contenido += texto[i]
         i++
         columna++
       }
       if (texto[i] !== "'") {
         sinCierre = true
       } else {
         i++
         columna++
       }
       if (sinCierre) {
         errores.push(mk('L-003', `Literal de caracter sin cerrar`, linea, col))
       } else if (contenido.length !== 1) {
         errores.push(mk('L-004', `Literal de caracter debe tener 1 carácter`, linea, col))
       }
       tokens.push({ tipo: 'CARACTER', texto: contenido, line: linea, column: col })
       continue
     }

     // Número
     if (c >= '0' && c <= '9') {
       const col = columna
       let num = ''
       while (i < n && (texto[i] >= '0' && texto[i] <= '9')) {
         num += texto[i]
         i++
         columna++
       }
       let tipo: TipoToken = 'ENTERO'
       if (i < n && texto[i] === '.' && (i + 1 < n && texto[i + 1] >= '0' && texto[i + 1] <= '9')) {
         num += '.'
         i++
         columna++
         while (i < n && texto[i] >= '0' && texto[i] <= '9') {
           num += texto[i]
           i++
           columna++
         }
         tipo = 'REAL'
       }
       tokens.push({ tipo, texto: num, line: linea, column: col })
       continue
     }

     // Identificador / palabra clave
     if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_') {
       const col = columna
       let id = ''
       while (i < n && esIdentChar(texto[i])) {
         id += texto[i]
         i++
         columna++
       }
       if (PALABRAS_CLAVE.has(id)) {
         tokens.push({ tipo: 'PALABRA_CLAVE', texto: id, line: linea, column: col })
       } else {
         tokens.push({ tipo: 'IDENT', texto: id, line: linea, column: col })
       }
       continue
     }

     // Símbolos de dos caracteres
     const dos = texto.slice(i, i + 2)
     if (SIMBOLOS_DOS.has(dos)) {
       tokens.push({ tipo: 'SIMBOLO', texto: dos, line: linea, column: columna })
       i += 2
       columna += 2
       continue
     }

     // Símbolos de un carácter
     if (SIMBOLOS_UNO.has(c)) {
       tokens.push({ tipo: 'SIMBOLO', texto: c, line: linea, column: columna })
       i++
       columna++
       continue
     }

     // Carácter no reconocido
     errores.push(mk('L-001', `Carácter no reconocido: '${c}'`, linea, columna))
     i++
     columna++
   }

   tokens.push({ tipo: 'EOF', texto: '', line: linea, column: columna })
   return { tokens, errores }
 }

function esIdentChar(c: string): boolean {
   return (
     (c >= 'a' && c <= 'z') ||
     (c >= 'A' && c <= 'Z') ||
     (c >= '0' && c <= '9') ||
     c === '_'
   )
 }

function mk(code: string, message: string, line: number, column: number, severity: 'error' | 'warning' = 'error'): Diagnostico {
   return { line, column, message, code, severity }
 }

// API auxiliar para tests
export { mk }
