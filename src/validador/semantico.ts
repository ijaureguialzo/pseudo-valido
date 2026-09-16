import {
   Astrogram,
   Sentencia,
   Expr,
   Tipo,
   Diagnostico
 } from './tipos'

interface Alcance {
   variables: Map<string, string>
   inicializadas: Set<string>
   funciones: Map<
      string,
      {
         parametros: { nombre: string; tipo: string }[]
         cuerpo: Sentencia[]
         tipoRetorno: string
          }
        >
}

function nuevoAlcance(): Alcance {
   return { variables: new Map(), inicializadas: new Set(), funciones: new Map() }
}

function mapTipo(tipo: string): Tipo {
   switch (tipo) {
     case 'Entero': return Tipo.Entero
     case 'Real':   return Tipo.Real
     case 'Logico':   return Tipo.Logico
     case 'Caracter': return Tipo.Caracter
     case 'Cadena':   return Tipo.Cadena
     default: return Tipo.Desconocido
       }
}

function copiar(src: Alcance, dst: Alcance): void {
  for (const [k, v] of src.variables) dst.variables.set(k, v)
   for (const k of src.inicializadas) dst.inicializadas.add(k)
      }

function procesarFunciones(ast: Astrogram, alc: Alcance): void {
  for (const f of ast.funciones) {
    alc.funciones.set(f.nombre, {
       parametros: f.parametros, cuerpo: f.cuerpo, tipoRetorno: f.tipoRetorno })
       for (const p of f.parametros) {
         alc.variables.set(p.nombre, p.tipo)
         alc.inicializadas.add(p.nombre)
            }
        }
}

function marcar(
    errores: Diagnostico[], ya: Set<string>,
    code: string, clave: string,
    line: number, column: number,
    msg: string, severity: 'error' | 'warning' = 'error'
      ): void {
  if (ya.has(clave)) return
   ya.add(clave)
   errores.push({ line, column, message: msg, code, severity })
      }

function estaDeclarada(alc: Alcance, fAlc: Alcance, nom: string): boolean {
  return nom === 'resultado' || alc.variables.has(nom) || fAlc.variables.has(nom)
      }

function estaInicializada(alc: Alcance, fAlc: Alcance, nom: string): boolean {
  return nom === 'resultado' || alc.inicializadas.has(nom) || fAlc.inicializadas.has(nom)
      }

function analizarCuerpo(
    cuerpo: Sentencia[], alc: Alcance, fAlc: Alcance,
    errores: Diagnostico[], ya: Set<string>,
    funcionActual: string | undefined
      ): void {
  for (const s of cuerpo) analizarSentencia(s, alc, fAlc, errores, ya, funcionActual)
      }

function analizarSentencia(
    s: Sentencia, alc: Alcance, fAlc: Alcance,
    errores: Diagnostico[], ya: Set<string>,
    funcionActual: string | undefined
      ): void {
  switch (s.t) {
    case 'declaracion': {
      if (fAlc.variables.has(s.nombre)) {
         marcar(errores, ya, 'M-002', 'M-002:' + s.tok.line,
                s.tok.line, s.tok.column, `Variable '${s.nombre}' ya está declarada`)
               }
       fAlc.variables.set(s.nombre, s.tipo)
       break
        }
    case 'asignacion': {
      if (!estaDeclarada(alc, fAlc, s.nombre)) {
         marcar(errores, ya, 'M-001', 'M-001:' + s.nombre,
                s.tok.line, s.tok.column, `Variable '${s.nombre}' no declarada`)
       } else {
         fAlc.inicializadas.add(s.nombre)
        }
      revisarExpr(s.valor, fAlc, alc, errores, ya, funcionActual)
      break
         }
    case 'leer': {
      if (!estaDeclarada(alc, fAlc, s.nombre)) {
         marcar(errores, ya, 'M-004', 'M-004:' + s.nombre,
                s.tok.line, s.tok.column, `Variable '${s.nombre}' no declarada`)
       } else {
         fAlc.inicializadas.add(s.nombre)
        }
      break
         }
    case 'escribir': {
      for (const e of s.args) revisarExpr(e, fAlc, alc, errores, ya, funcionActual)
      break
        }
    case 'si': {
      revisarExpr(s.condicion, fAlc, alc, errores, ya, funcionActual)
      { const sub = nuevoAlcance(); copiar(fAlc, sub)
        analizarCuerpo(s.cuerpoSi, alc, sub, errores, ya, funcionActual) }
      if (s.cuerpoSiNo) {
        const sub2 = nuevoAlcance(); copiar(fAlc, sub2)
        analizarCuerpo(s.cuerpoSiNo, alc, sub2, errores, ya, funcionActual) }
       break
        }
    case 'mientras': {
      revisarExpr(s.condicion, fAlc, alc, errores, ya, funcionActual)
      { const sub = nuevoAlcance(); copiar(fAlc, sub)
        analizarCuerpo(s.cuerpo, alc, sub, errores, ya, funcionActual) }
      break
        }
    case 'repetir': {
      revisarExpr(s.condicion, fAlc, alc, errores, ya, funcionActual)
      { const sub = nuevoAlcance(); copiar(fAlc, sub)
        analizarCuerpo(s.cuerpo, alc, sub, errores, ya, funcionActual) }
      break
        }
    case 'para': {
      const p = s
      fAlc.variables.set(p.variable, 'Entero')
      fAlc.inicializadas.add(p.variable)
      revisarExpr(p.inicial, fAlc, alc, errores, ya, funcionActual)
      revisarExpr(p.condicion, fAlc, alc, errores, ya, funcionActual)
      if (!p.cambio) {
         marcar(errores, ya, 'M-018', 'M-018:' + p.variable,
                p.tok.line, p.tok.column,
                'Para sin "Cambio" — posible bucle infinito', 'warning') }
      if (p.cambio) revisarExpr(p.cambio, fAlc, alc, errores, ya, funcionActual)
      break
        }
    }
}

function revisarExpr(
    e: Expr, fAlc: Alcance, alc: Alcance,
    errores: Diagnostico[], ya: Set<string>,
    funcionActual: string | undefined
      ): void {
  switch (e.t) {
    case 'ident': {
      const nom = e.nombre
      if (!estaDeclarada(alc, fAlc, nom)) {
         marcar(errores, ya, 'M-001', 'M-001:' + nom,
                e.tok.line, e.tok.column, `Variable '${nom}' no declarada`) }
       if (nom !== 'resultado' && estaDeclarada(alc, fAlc, nom)
           && !estaInicializada(alc, fAlc, nom)) {
          marcar(errores, ya, 'M-003', 'M-003:' + nom,
                e.tok.line, e.tok.column, `Variable '${nom}' usada sin inicializar`) }
       break
          }
    case 'llamada': {
      const def = alc.funciones.get(e.nombre)
      if (!def) {
         marcar(errores, ya, 'M-012', 'M-012:' + e.nombre,
                e.tok.line, e.tok.column, `Función '${e.nombre}' no está definida`)
              break }
       if (funcionActual === e.nombre) {
         marcar(errores, ya, 'M-015', 'M-015:' + e.nombre,
                e.tok.line, e.tok.column,
                `Recursión no declarada: '${e.nombre}' se llama a sí misma`) }
      for (const a of e.args) revisarExpr(a, fAlc, alc, errores, ya, funcionActual)
      break
          }
    case 'binaria': {
      revisarExpr(e.izq, fAlc, alc, errores, ya, funcionActual)
      revisarExpr(e.der, fAlc, alc, errores, ya, funcionActual)
      if (e.op === '&&' || e.op === '||') {
        const t = inferTipo(e.izq, fAlc, alc)
        if (t !== Tipo.Logico && t !== Tipo.Desconocido) {
          marcar(errores, ya, 'M-010', 'M-010:' + e.tok.line + ':' + e.tok.column,
                e.tok.line, e.tok.column, `Operador '${e.op}' con operando no lógico`) } }
       break
          }
    case 'unaria': {
      if (e.op === '!') {
        const t = inferTipo(e.operando, fAlc, alc)
        if (t !== Tipo.Logico && t !== Tipo.Desconocido) {
          marcar(errores, ya, 'M-010', 'M-010:' + e.tok.line + ':' + e.tok.column,
                e.tok.line, e.tok.column, 'Operador "!" con operando no lógico') } }
      revisarExpr(e.operando, fAlc, alc, errores, ya, funcionActual)
      break
          }
     }
}

function inferTipo(e: Expr, fAlc: Alcance, alc: Alcance): Tipo {
  switch (e.t) {
    case 'numero': return (e as unknown as { tipo: Tipo }).tipo || Tipo.Entero
    case 'cadena': return Tipo.Cadena
    case 'caracter': return Tipo.Caracter
    case 'literalBool': return Tipo.Logico
    case 'ident': {
      if (e.nombre === 'resultado') {
        for (const [, f] of alc.funciones) {
          for (const c of f.cuerpo) {
            if (c.t === 'asignacion' && (c as { nombre: string }).nombre === 'resultado') {
               return mapTipo(f.tipoRetorno) } } }
        return Tipo.Desconocido }
      const t = fAlc.variables.get(e.nombre) || alc.variables.get(e.nombre)
      return t ? mapTipo(t) : Tipo.Desconocido }
    case 'llamada': {
      const def = alc.funciones.get(e.nombre)
      return def ? mapTipo(def.tipoRetorno) : Tipo.Desconocido }
    case 'binaria': {
      if (e.op === '&&' || e.op === '||') return Tipo.Logico
      if (['==', '!=', '<', '>', '<=', '>='].includes(e.op)) return Tipo.Logico
      const ti = inferTipo(e.izq, fAlc, alc)
      const td = inferTipo(e.der, fAlc, alc)
      if (ti === Tipo.Cadena || td === Tipo.Cadena
          || ti === Tipo.Caracter || td === Tipo.Caracter) return Tipo.Cadena
      if (ti === Tipo.Real || td === Tipo.Real) return Tipo.Real
      return Tipo.Entero }
    case 'unaria': {
      if (e.op === '!') return Tipo.Logico
      return inferTipo(e.operando, fAlc, alc) }
    default: return Tipo.Desconocido }
}

export function checkSemantico(ast: Astrogram): Diagnostico[] {
  const alc = nuevoAlcance()
  const errores: Diagnostico[] = []
  const ya = new Set<string>()

  procesarFunciones(ast, alc)

  for (const f of ast.funciones) {
    const fAlc = nuevoAlcance()
    copiar(alc, fAlc)
    analizarCuerpo(f.cuerpo, alc, fAlc, errores, ya, f.nombre) }

  if (ast.algoritmo) {
    const fAlc = nuevoAlcance()
    copiar(alc, fAlc)
    analizarCuerpo(ast.algoritmo.cuerpo, alc, fAlc, errores, ya, undefined) }

  return errores }

export { nuevoAlcance, revisarExpr, inferTipo, mapTipo }
