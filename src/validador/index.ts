import { parsear } from './sintactico'
import { checkSemantico } from './semantico'
import type { Diagnostico, ResultadoValidacion, Astrogram } from './tipos'

// Ordena por (linea, columna, code) para salida determinista.
function ordenar(diags: Diagnostico[]): Diagnostico[] {
   return [...diags].sort((a, b) => {
     if (a.line !== b.line) return a.line - b.line
     if (a.column !== b.column) return a.column - b.column
     return a.code.localeCompare(b.code)
     })
}

// Orquesta: léxico → sintáctico → semántico.
export function validar(texto: string): ResultadoValidacion {
   const { ast, errores } = parsear(texto)

   const tieneErrorSintaxis = errores.some((e) => e.severity === 'error')
   let semanticos: Diagnostico[] = []
   if (!tieneErrorSintaxis) {
     semanticos = checkSemantico(ast as Astrogram)
     }
   // Si hay error de sintaxis, no analizamos semántica (la base no es fiable).

   const todos = [...errores, ...semanticos]
   const ordenados = ordenar(todos)
   const correcto = ordenados.filter((d) => d.severity === 'error').length === 0
   return { correcto, diagnosticos: ordenados }
   }
