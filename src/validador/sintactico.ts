import {
   Token,
   Diagnostico,
   Astrogram,
   Sentencia,
   Expr,
   NodoSi,
   NodoMientras,
   NodoRepetir,
   NodoPara,
   NodoSegun,
   NodoCaso,
   NodoDeclaracion,
   NodoLeer,
   NodoEscribir,
   NodoFuncion,
   NodoAlgoritmo,
   Tipo
 } from './tipos'
import { lexear } from './lexico'

// Tokens que pueden cerrar un bloque al inicio de una sentencia.
const CIERRES = new Set([
   'FinSi', 'FinSegun', 'FinMientras', 'FinPara', 'FinFuncion', 'FinAlgoritmo', 'SiNo', 'EOF'
])

interface Ctx {
   toks: Token[]
   pos: number
   errores: Diagnostico[]
}

export function parsear(texto: string): { ast: Astrogram; errores: Diagnostico[] } {
   const { tokens, errores } = lexear(texto)
   const toks = tokens.filter((t) => t.tipo !== 'COMENTARIO')
   const ctx: Ctx = { toks, pos: 0, errores }

   const funciones: NodoFuncion[] = []
   let algoritmo: NodoAlgoritmo | null = null

   while (curr(ctx).tipo !== 'EOF') {
     if (isKey(ctx, 'Funcion')) {
       funciones.push(parseFuncion(ctx))
       // Tras el Algoritmo pueden ir más Funciones (G-01 §3): se sigue
       // parseando; el segundo Algoritmo se detecta abajo en la siguiente
       // iteración (ya 'algoritmo' no es null) y marca S-322.
      } else if (algoritmo !== null) {
      // Ya existe un algoritmo principal: no se admite otro (S-322). Si se
      // detecta un segundo 'Algoritmo' se consume su cuerpo entero para no
      // marcar el error en cada token; el resto se desecha uno a uno.
      if (isKey(ctx, 'Algoritmo')) {
      const segAlgo = parseAlgoritmo(ctx)
      ctx.errores.push(err('S-322', `Segundo algoritmo principal: solo se admite uno`, segAlgo.tok.line, segAlgo.tok.column))
       } else {
      const t = advance(ctx)
      ctx.errores.push(err('S-322', `Contenido tras el algoritmo principal no permitido`, t.line, t.column))
       }
      } else if (isKey(ctx, 'Algoritmo')) {
      algoritmo = parseAlgoritmo(ctx)
      } else {
      const t = advance(ctx)
      ctx.errores.push(err('S-001', `Esperaba 'Algoritmo' o 'Funcion'`, t.line, t.column))
      }
      }

   return { ast: { funciones, algoritmo }, errores }
}

function tokAt(ctx: Ctx): Token {
   return ctx.toks[ctx.pos]
}
function curr(ctx: Ctx): Token {
   return ctx.toks[ctx.pos] || ctx.toks[ctx.toks.length - 1]
}
function advance(ctx: Ctx): Token {
   const t = curr(ctx)
   ctx.pos++
   return t
}
function isKey(ctx: Ctx, w: string): boolean {
   const t = curr(ctx)
   return t.tipo === 'PALABRA_CLAVE' && t.texto === w
}
function isKeyIn(ctx: Ctx, ws: string[]): boolean {
   const t = curr(ctx)
   return t.tipo === 'PALABRA_CLAVE' && ws.includes(t.texto)
}
function isSym(ctx: Ctx, s: string): boolean {
   const t = curr(ctx)
   return t.tipo === 'SIMBOLO' && t.texto === s
}
function esCierre(ctx: Ctx): boolean {
   return CIERRES.has(curr(ctx).texto)
}

// --- expect helpers ---
function expectSym(ctx: Ctx, s: string, msg: string): Token {
   const t = curr(ctx)
   if (t.tipo === 'SIMBOLO' && t.texto === s) return advance(ctx)
   ctx.errores.push(err('S-019', `${msg} (obtenido '${t.texto || 'EOF'}' l${t.line})`, t.line, t.column))
   return t
}
function expectKey(ctx: Ctx, w: string, msg: string): Token {
   const t = curr(ctx)
   if (t.tipo === 'PALABRA_CLAVE' && t.texto === w) return advance(ctx)
   ctx.errores.push(err('S-019', `${msg} (obtenido '${t.texto || 'EOF'}' l${t.line})`, t.line, t.column))
   return t
}
function expectIdent(ctx: Ctx, msg: string): string {
   const t = curr(ctx)
   if (t.tipo === 'IDENT' || t.tipo === 'PALABRA_CLAVE') return advance(ctx).texto
   ctx.errores.push(err('S-019', `${msg} (obtenido '${t.texto || 'EOF'}')`, t.line, t.column))
   return '<sin-nombre>'
}
function expectTipo(ctx: Ctx): string {
   const t = curr(ctx)
   const tipos = ['Entero', 'Real', 'Logico', 'Caracter', 'Cadena']
   if (t.tipo === 'PALABRA_CLAVE' && tipos.includes(t.texto)) return advance(ctx).texto
   ctx.errores.push(err('M-005', `Tipo de dato no válido: '${t.texto || 'EOF'}'`, t.line, t.column))
   if (t.tipo !== 'EOF') ctx.pos++
   return 'Desconocido'
}

// --- estructuras ---
function parseFuncion(ctx: Ctx): NodoFuncion {
   const inicio = advance(ctx) // Funcion
   const nombre = expectIdent(ctx, 'El nombre de la función')
   expectSym(ctx, '(', 'Paréntesis de parámetros')
   const parametros: { nombre: string; tipo: string }[] = []
   if (curr(ctx).texto !== ')') {
     parametros.push(parseParam(ctx))
     while (isSym(ctx, ',')) {
       advance(ctx)
       parametros.push(parseParam(ctx))
     }
   }
   expectSym(ctx, ')', 'Cerrar paréntesis de parámetros')
   expectSym(ctx, '->', 'Falta "->" de tipo de retorno')
   const tipoRetorno = expectTipo(ctx)
   const cuerpo = parseSentencias(ctx)
   if (!isKey(ctx, 'FinFuncion')) {
     const t = curr(ctx)
     ctx.errores.push(err('S-003', `Falta 'FinFuncion'`, t.line, t.column))
   } else {
     advance(ctx)
   }
   return { t: 'funcion', nombre, parametros, tipoRetorno, cuerpo, tok: inicio }
}

function parseParam(ctx: Ctx): { nombre: string; tipo: string } {
   expectKey(ctx, 'Declarar', 'Parámetro: espero "Declarar"')
   const nombre = expectIdent(ctx, 'Parámetro: nombre')
   expectKey(ctx, 'Como', 'Parámetro: espero "Como"')
   const tipo = expectTipo(ctx)
   return { nombre, tipo }
}

function parseAlgoritmo(ctx: Ctx): NodoAlgoritmo {
   const inicio = advance(ctx) // Algoritmo
   const nombre = expectIdent(ctx, 'El nombre del algoritmo')
   const cuerpo = parseSentencias(ctx)
   if (!isKey(ctx, 'FinAlgoritmo')) {
     const t = curr(ctx)
     ctx.errores.push(err('S-002', `Falta 'FinAlgoritmo'`, t.line, t.column))
   } else {
     advance(ctx)
   }
   return { t: 'algoritmo', nombre, cuerpo, tok: inicio }
}

function peek(ctx: Ctx, k: number = 1): Token {
   return ctx.toks[ctx.pos + k] || ctx.toks[ctx.toks.length - 1]
}
function canStartSentencia(ctx: Ctx): boolean {
   const t = curr(ctx)
   if (t.tipo === 'EOF') return false
   const starts = new Set([
      'Si', 'Mientras', 'Repetir', 'Segun', 'Para', 'Declarar', 'Leer', 'Escribir'
   ])
   if (t.tipo === 'PALABRA_CLAVE' && starts.has(t.texto)) return true
   // asignación: identificador seguido de '='
   if (t.tipo === 'IDENT') {
      const n = peek(ctx)
      return n.tipo === 'SIMBOLO' && n.texto === '='
   }
   // cualquier otro token (número suelto, cierre, etc.) no inicia sentencia.
   return false
}

function parseSentencias(ctx: Ctx, stop?: (ctx: Ctx) => boolean): Sentencia[] {
   const sent: Sentencia[] = []
   while (true) {
     if (stop && stop(ctx)) break
     const t = curr(ctx)
     if (t.tipo === 'EOF' || CIERRES.has(t.texto)) break
     if (!canStartSentencia(ctx)) break
     const s = parseSentencia(ctx)
     if (s) sent.push(s)
    }
   return sent
}

// ¿El 'Mientras' actual es la condición de SALIDA de un Repetir (y no un bucle
// Mientras…Hacer del cuerpo)? Lo es si, buscando hacia adelante, aparece un
// cierre o EOF ANTES que cualquier 'Hacer'.
function esMientrasSalida(ctx: Ctx): boolean {
   if (curr(ctx).texto !== 'Mientras') return false
   let p = ctx.pos + 1
   const closes = new Set([
      'FinAlgoritmo', 'FinMientras', 'FinPara', 'FinSi', 'FinSegun', 'FinFuncion', 'SiNo'
   ])
   while (p < ctx.toks.length) {
     const tk = ctx.toks[p]
     if (tk.tipo === 'EOF') return true
     if (tk.texto === 'Hacer') return false
     if (closes.has(tk.texto)) return true
     p++
     }
   return true
}

function parseSentencia(ctx: Ctx): Sentencia | null {
   const t = curr(ctx)
   switch (t.texto) {
     case 'Si': return parseSi(ctx)
     case 'Mientras': return parseMientras(ctx)
     case 'Repetir': return parseRepetir(ctx)
     case 'Segun': return parseSegun(ctx)
     case 'Para': return parsePara(ctx)
     case 'Declarar': return parseDeclarar(ctx)
     case 'Leer': return parseLeer(ctx)
     case 'Escribir': return parseEscribir(ctx)
     case 'Hacer':
       ctx.errores.push(err('S-011', `'Hacer' sin apertura`, t.line, t.column))
       advance(ctx)
       return null
     default:
       if (t.tipo === 'IDENT') {
         const nombre = t.texto
         advance(ctx) // consumir el identificador
         if (isSym(ctx, '=')) {
           const as = advance(ctx)
           const valor = parseExpr(ctx)
           return { t: 'asignacion', nombre, valor, tok: as }
          }
         ctx.errores.push(err('S-019', `Token inesperado '${nombre}'`, t.line, t.column))
         return null
        }
       ctx.errores.push(err('S-019', `Token inesperado '${t.texto || 'EOF'}'`, t.line, t.column))
       advance(ctx)
       return null
   }
}

function parseSi(ctx: Ctx): NodoSi {
   const inicio = advance(ctx) // Si
   const condicion = parseExpr(ctx)
   expectKey(ctx, 'Entonces', 'Falta "Entonces"')
   const cuerpoSi = parseSentencias(ctx)
   let cuerpoSiNo: Sentencia[] | null = null
   if (isKey(ctx, 'SiNo')) {
     advance(ctx)
     cuerpoSiNo = parseSentencias(ctx)
   }
   if (!isKey(ctx, 'FinSi')) {
     ctx.errores.push(err('S-004', `Falta 'FinSi'`, curr(ctx).line, curr(ctx).column))
   } else {
     advance(ctx)
   }
   return { t: 'si', condicion, cuerpoSi, cuerpoSiNo, tok: inicio }
}

function parseMientras(ctx: Ctx): NodoMientras {
   const inicio = advance(ctx) // Mientras
   const condicion = parseExpr(ctx)
   expectKey(ctx, 'Hacer', 'Falta "Hacer" en "Mientras ..."')
   const cuerpo = parseSentencias(ctx)
   if (!isKey(ctx, 'FinMientras')) {
     ctx.errores.push(err('S-005', `Falta 'FinMientras'`, curr(ctx).line, curr(ctx).column))
   } else {
     advance(ctx)
   }
   return { t: 'mientras', condicion, cuerpo, tok: inicio }
}

function parseRepetir(ctx: Ctx): NodoRepetir {
   const inicio = advance(ctx) // Repetir
   const cuerpo = parseSentencias(ctx, esMientrasSalida)
   if (isKey(ctx, 'Mientras')) {
     advance(ctx)
     const condicion = parseExpr(ctx)
     return { t: 'repetir', cuerpo, condicion, tok: inicio }
   }
   const t = curr(ctx)
   ctx.errores.push(err('S-008', `Falta 'Mientras ...' que cierra 'Repetir'`, t.line, t.column))
   return { t: 'repetir', cuerpo, condicion: { t: 'literalBool', valor: false, tok: t }, tok: inicio }
}

function parsePara(ctx: Ctx): NodoPara {
   const inicio = advance(ctx) // Para
   const variable = expectIdent(ctx, 'Variable de control de "Para"')
   expectSym(ctx, '=', 'Falta "=" en "Para"')
   const inicial = parseExpr(ctx)
   expectKey(ctx, 'Mientras', 'Falta "Mientras" en "Para"')
   const condicion = parseExpr(ctx)
   let cambio: Expr | null = null
   if (isKey(ctx, 'Cambio')) {
     advance(ctx)
     cambio = parseExpr(ctx)
   }
   expectKey(ctx, 'Hacer', 'Falta "Hacer" en "Para"')
   const cuerpo = parseSentencias(ctx)
   if (!isKey(ctx, 'FinPara')) {
     ctx.errores.push(err('S-006', `Falta 'FinPara'`, curr(ctx).line, curr(ctx).column))
   } else {
     advance(ctx)
   }
   return { t: 'para', variable, inicial, condicion, cambio, cuerpo, tok: inicio }
}

function parseSegun(ctx: Ctx): NodoSegun {
   const inicio = advance(ctx) // Segun
   const expresion = parseExpr(ctx)
   expectKey(ctx, 'Hacer', 'Falta "Hacer" en "Segun"')
   const casos: NodoCaso[] = []
   while (!isKeyIn(ctx, ['DeOtroModo', 'FinSegun']) && curr(ctx).tipo !== 'EOF') {
     if (CIERRES.has(curr(ctx).texto) && !isKeyIn(ctx, ['DeOtroModo'])) break
     const exp = parseExpr(ctx)
     expectSym(ctx, ':', 'Falta ":" en caso de "Segun"')
     const cuerpo = parseSentencias(ctx)
     casos.push({ t: 'caso', valor: exp, cuerpo, tok: exp.tok })
   }
   let deOtroModo: Sentencia[] | null = null
   if (isKey(ctx, 'DeOtroModo')) {
     advance(ctx)
     expectSym(ctx, ':', 'Falta ":" después de "DeOtroModo"')
     deOtroModo = parseSentencias(ctx)
   }
   if (!isKey(ctx, 'FinSegun')) {
     ctx.errores.push(err('S-007', `Falta 'FinSegun'`, curr(ctx).line, curr(ctx).column))
   } else {
     advance(ctx)
   }
   return { t: 'segun', expresion, casos, deOtroModo, tok: inicio }
}

function parseDeclarar(ctx: Ctx): NodoDeclaracion {
   const inicio = advance(ctx) // Declarar
   const nombre = expectIdent(ctx, 'Variable a declarar')
   expectKey(ctx, 'Como', 'Falta "Como" en declaración')
   const tipo = expectTipo(ctx)
   return { t: 'declaracion', nombre, tipo, tok: inicio }
}

function parseLeer(ctx: Ctx): NodoLeer {
   const inicio = advance(ctx) // Leer
   const t = curr(ctx)
   if (t.tipo === 'IDENT') {
     advance(ctx)
     return { t: 'leer', nombre: t.texto, tok: inicio }
   }
   ctx.errores.push(err('S-012', `'Leer' espera un identificador`, t.line, t.column))
   return { t: 'leer', nombre: '<sin-nombre>', tok: inicio }
}

function parseEscribir(ctx: Ctx): NodoEscribir {
   const inicio = advance(ctx) // Escribir
   const args: Expr[] = []
   args.push(parseExpr(ctx))
   while (isSym(ctx, ',')) {
     advance(ctx)
     args.push(parseExpr(ctx))
   }
   return { t: 'escribir', args, tok: inicio }
}

// --- Expresiones: precedencia ! > * / % > + - > < <= > >= > == != > && > || ---
function parseExpr(ctx: Ctx): Expr {
  return parseOr(ctx)
}
function parseOr(ctx: Ctx): Expr {
  let izq = parseAnd(ctx)
  while (isSym(ctx, '||')) {
   const op = advance(ctx)
   const der = parseAnd(ctx)
   izq = { t: 'binaria', op: '||', izq, der, tok: op }
  }
  return izq
}
function parseAnd(ctx: Ctx): Expr {
  let izq = parseIgual(ctx)
  while (isSym(ctx, '&&')) {
   const op = advance(ctx)
   const der = parseIgual(ctx)
   izq = { t: 'binaria', op: '&&', izq, der, tok: op }
  }
  return izq
}
function parseIgual(ctx: Ctx): Expr {
  let izq = parseRel(ctx)
  while (isSym(ctx, '==') || isSym(ctx, '!=')) {
   const op = advance(ctx)
   const der = parseRel(ctx)
   izq = { t: 'binaria', op: op.texto, izq, der, tok: op }
  }
  return izq
}
function parseRel(ctx: Ctx): Expr {
  let izq = parseSuma(ctx)
  while (isSym(ctx, '>') || isSym(ctx, '<') || isSym(ctx, '>=') || isSym(ctx, '<=')) {
   const op = advance(ctx)
   const der = parseSuma(ctx)
   izq = { t: 'binaria', op: op.texto, izq, der, tok: op }
  }
  return izq
}
function parseSuma(ctx: Ctx): Expr {
  let izq = parseFactor(ctx)
  while (isSym(ctx, '+') || isSym(ctx, '-')) {
   const op = advance(ctx)
   const der = parseFactor(ctx)
   izq = { t: 'binaria', op: op.texto, izq, der, tok: op }
  }
  return izq
}
function parseFactor(ctx: Ctx): Expr {
  let izq = parseUnario(ctx)
  while (isSym(ctx, '*') || isSym(ctx, '/') || isSym(ctx, '%')) {
   const op = advance(ctx)
   const der = parseUnario(ctx)
   izq = { t: 'binaria', op: op.texto, izq, der, tok: op }
  }
  return izq
}
function parseUnario(ctx: Ctx): Expr {
  if (isSym(ctx, '!')) {
   const op = advance(ctx)
   return { t: 'unaria', op: '!', operando: parseUnario(ctx), tok: op }
  }
  if (isSym(ctx, '-')) {
   const op = advance(ctx)
   return { t: 'unaria', op: '-', operando: parseUnario(ctx), tok: op }
  }
  return parsePrimario(ctx)
}
function parsePrimario(ctx: Ctx): Expr {
  const t = curr(ctx)
  if (isSym(ctx, '(')) {
   const abrir = advance(ctx)
   const v = parseExpr(ctx)
   expectSym(ctx, ')', 'Paréntesis desparejado')
   return { t: 'par', valor: v, tok: abrir }
  }
  if (t.tipo === 'ENTERO' || t.tipo === 'REAL') {
   advance(ctx)
   return { t: 'numero', valor: Number(t.texto), tipo: t.tipo === 'REAL' ? Tipo.Real : Tipo.Entero, tok: t }
  }
  if (t.tipo === 'CADENA') {
   advance(ctx)
   return { t: 'cadena', valor: t.texto, tok: t }
  }
  if (t.tipo === 'CARACTER') {
   advance(ctx)
   return { t: 'caracter', valor: t.texto, tok: t }
  }
  if (t.texto === 'verdadero' || t.texto === 'falso') {
   advance(ctx)
   return { t: 'literalBool', valor: t.texto === 'verdadero', tok: t }
  }
  if (t.tipo === 'IDENT') {
   advance(ctx)
   if (isSym(ctx, '(')) {
    const abrir = advance(ctx)
    const args: Expr[] = []
    if (curr(ctx).texto !== ')') {
     args.push(parseExpr(ctx))
     while (isSym(ctx, ',')) {
      advance(ctx)
      args.push(parseExpr(ctx))
     }
    }
    expectSym(ctx, ')', 'Paréntesis desparejado en llamada')
    return { t: 'llamada', nombre: t.texto, args, tok: abrir }
   }
   return { t: 'ident', nombre: t.texto, tok: t }
  }

  ctx.errores.push(err('S-017', `Operando inesperado: '${t.texto || 'EOF'}'`, t.line, t.column))
  advance(ctx)
  return { t: 'literalBool', valor: false, tok: t }
}

function err(code: string, msg: string, line: number, column: number, severity: 'error' | 'warning' = 'error'): Diagnostico {
  return { line, column, message: msg, code, severity }
}
