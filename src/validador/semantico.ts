import {
   Astrogram,
   Sentencia,
   Expr,
   Tipo,
   Diagnostico,
   esNumerico,
   Token
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
     case 'Nada':     return Tipo.Nada
     default: return Tipo.Desconocido
        }
}

function copiar(src: Alcance, dst: Alcance): void {
  for (const [k, v] of src.variables) dst.variables.set(k, v)
   for (const k of src.inicializadas) dst.inicializadas.add(k)
      }

function procesarFunciones(
    ast: Astrogram, alc: Alcance,
    errores: Diagnostico[], ya: Set<string>
): void {
  for (const f of ast.funciones) {
    // M-025: una función no puede declararse dos veces con el mismo nombre.
    // La segunda (y sucesivas) definición se marca por su token de apertura.
    if (alc.funciones.has(f.nombre)) {
       marcar(errores, ya, 'M-025', 'M-025:' + f.nombre,
          f.tok.line, f.tok.column,
             `La función '${f.nombre}' ya está declarada`)
       }
    alc.funciones.set(f.nombre, {
       parametros: f.parametros, cuerpo: f.cuerpo, tipoRetorno: f.tipoRetorno })
    // D-alcance: los parámetros NO se registran en el ámbito del programa
    // principal: el ámbito de un parámetro es la propia función que lo
    // declara. Por eso `sumar(a, b)` fuera de su definición dispara M-001.
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

// ¿La función en la que estamos analizando declara `-> Nada`? En ese caso no
// puede usar `resultado` ni declararlo: su aparición es M-026.
function funcionRetornaNada(alc: Alcance, funcionActual: string | undefined): boolean {
  if (!funcionActual) return false
  const def = alc.funciones.get(funcionActual)
  return !!def && mapTipo(def.tipoRetorno) === Tipo.Nada
}

// Tipo declarado del destino de una asignación/lectura. 'resultado' hereda el
// tipo de retorno de la función anfitriona; las demás, su declaración.
function tipoDeclarado(dest: string, alc: Alcance, fAlc: Alcance): Tipo {
   if (dest === 'resultado') {
     for (const [, f] of alc.funciones) {
       const t = mapTipo(f.tipoRetorno)
       if (t !== Tipo.Desconocido) return t
      }
     return Tipo.Desconocido
    }
   const raw = fAlc.variables.get(dest) ?? alc.variables.get(dest)
   return raw ? mapTipo(raw) : Tipo.Desconocido
}

// Compatibilidad estricta (sin conversión): un valor de tipo `fuente` cabe en
// una variable de tipo `destino` si ambos son numéricos (Entero→Real se ensancha
// en un único sentido) o si son idénticos. Todo lo demás es M-016 / M-009.
// `Desconocido` se deja pasar.
function compatible(fuente: Tipo, destino: Tipo): boolean {
   if (fuente === Tipo.Desconocido || destino === Tipo.Desconocido) return true
   if (destino === Tipo.Entero) return fuente === Tipo.Entero
   if (destino === Tipo.Real) return esNumerico(fuente)
   return fuente === destino
}

function marcarAsignacion(
     s: { nombre: string; valor: Expr; tok: Token },
     fAlc: Alcance, alc: Alcance, errores: Diagnostico[], ya: Set<string>
): void {
   fAlc.inicializadas.add(s.nombre)
   const tDest = tipoDeclarado(s.nombre, alc, fAlc)
   const tVal = inferTipo(s.valor, fAlc, alc)
   if (!compatible(tVal, tDest)) {
    marcar(errores, ya, 'M-016', 'M-016:' + s.nombre + ':' + s.tok.line,
           s.tok.line, s.tok.column,
           `Tipo incompatible: no se puede asignar (${tVal}) a la variable '${s.nombre}' (${tDest})`)
    }
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
      // M-026: en una función `-> Nada` no existe `resultado`; declararla es un
      // error y, al ser la aparición que se pide detectar, no se recae en M-002.
      if (s.nombre === 'resultado' && funcionRetornaNada(alc, funcionActual)) {
        marcar(errores, ya, 'M-026', 'M-026:' + s.tok.line,
               s.tok.line, s.tok.column,
                 "'resultado' no existe en una función que no devuelve valor ('-> Nada')")
        break
        }
      if (fAlc.variables.has(s.nombre)) {
        marcar(errores, ya, 'M-002', 'M-002:' + s.tok.line,
               s.tok.line, s.tok.column, `Variable '${s.nombre}' ya está declarada`)
              }
      fAlc.variables.set(s.nombre, s.tipo)
      break
        }
    case 'asignacion': {
      // M-026: en una función `-> Nada` no puede asignarse a `resultado`.
      if (s.nombre === 'resultado' && funcionRetornaNada(alc, funcionActual)) {
        marcar(errores, ya, 'M-026', 'M-026:' + s.tok.line,
               s.tok.line, s.tok.column,
                  "'resultado' no existe en una función que no devuelve valor ('-> Nada')")
        break
         }
      if (!estaDeclarada(alc, fAlc, s.nombre)) {
        marcar(errores, ya, 'M-001', 'M-001:' + s.nombre,
               s.tok.line, s.tok.column, `Variable '${s.nombre}' no declarada`)
         } else {
         marcarAsignacion(s, fAlc, alc, errores, ya)
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
    case 'llamada': {
      // Llamada usada como sentencia por sus efectos (`menu()`), típica de una
      // función `-> Nada` (D-Nada). Su validación (M-012 nº args M-013/M-009,
      // M-015) es la misma que en expresión: el nodo es idéntico a una 'llamada'.
      revisarExpr(s, fAlc, alc, errores, ya, funcionActual)
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
      // El valor inicial es una asignación implícita a la variable de control
      // (forzada a Entero): exige numerico o dispara M-016.
      const tIni = inferTipo(p.inicial, fAlc, alc)
      if (tIni !== Tipo.Desconocido && !esNumerico(tIni)) {
         marcar(errores, ya, 'M-016', 'M-016:' + p.variable + ':' + p.tok.line,
                p.tok.line, p.tok.column,
                `Tipo incompatible: el inicial de 'Para' debe ser numérico`)
         }
      if (!p.cambio) {
         marcar(errores, ya, 'M-018', 'M-018:' + p.variable,
                p.tok.line, p.tok.column,
                 'Para sin "Cambio" — posible bucle infinito', 'warning')
       }
      if (p.cambio) {
       revisarExpr(p.cambio, fAlc, alc, errores, ya, funcionActual)
       // 'Cambio' actualiza el contador: debe ser numérico (M-024).
       const tCam = inferTipo(p.cambio, fAlc, alc)
       if (tCam !== Tipo.Desconocido && !esNumerico(tCam)) {
          marcar(errores, ya, 'M-024', 'M-024:' + p.variable + ':' + p.tok.line,
                 p.tok.line, p.tok.column,
                 "'Cambio' con expresión no numerica")
          }
          }
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
       // M-026: `resultado` usado en expresión dentro de una función `-> Nada`.
      if (nom === 'resultado' && funcionRetornaNada(alc, funcionActual)) {
        marcar(errores, ya, 'M-026', 'M-026:' + e.tok.line,
               e.tok.line, e.tok.column,
                   "'resultado' no existe en una función que no devuelve valor ('-> Nada')")
        break
          }
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
        break
       }
      if (funcionActual === e.nombre) {
        marcar(errores, ya, 'M-015', 'M-015:' + e.nombre,
          e.tok.line, e.tok.column,
           `Recursión no declarada: '${e.nombre}' se llama a sí misma`)
       }
       // Valida número (M-013) y tipo (M-009) de los argumentos frente a los
       // parámetros. La compatibilidad numérica admite el ensanche entero↔real
       // en ambos sentidos (ver G-01 §4.4), a diferencia de la asignación
       // (M-016), que exige fuente numérica con ensanche a Entero.
      const args = e.args
      const pars = def.parametros
      if (args.length !== pars.length) {
        marcar(errores, ya, 'M-013', 'M-013:' + e.nombre + ':' + args.length,
          e.tok.line, e.tok.column,
           `Nº de argumentos: ${args.length} (esperados ${pars.length})`)
       } else {
        let tiposOk = true
        for (let i = 0; i < pars.length && tiposOk; i++) {
          const src = mapTipo(inferTipo(args[i], fAlc, alc))
          const dst = mapTipo(pars[i].tipo)
          tiposOk = compatible(src, dst)
          }
        if (!tiposOk) {
          marcar(errores, ya, 'M-009', 'M-009:' + e.nombre,
            e.tok.line, e.tok.column,
              `Tipos de argumentos incoherentes con los parámetros de '${e.nombre}'`)
          }
        }
      for (const a of args) revisarExpr(a, fAlc, alc, errores, ya, funcionActual)
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

  procesarFunciones(ast, alc, errores, ya)

  for (const f of ast.funciones) {
    const fAlc = nuevoAlcance()
    copiar(alc, fAlc)
    // D-alcance: la función ve sus propios parámetros como variables locales
    // (y ya valorados al entrar), pero NO las hereda del cuerpo principal,
    // ni las deja caer fuera de su propio alcance.
    for (const p of f.parametros) {
       fAlc.variables.set(p.nombre, p.tipo)
       fAlc.inicializadas.add(p.nombre)
        }
    analizarCuerpo(f.cuerpo, alc, fAlc, errores, ya, f.nombre ) }

  if (ast.algoritmo) {
    const fAlc = nuevoAlcance()
    copiar(alc, fAlc)
    analizarCuerpo(ast.algoritmo.cuerpo, alc, fAlc, errores, ya, undefined) }

  return errores }

export { nuevoAlcance, revisarExpr, inferTipo, mapTipo }
