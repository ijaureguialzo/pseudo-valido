// Tipos de dominio del validador de pseudocódigo (G-01).
// Módulo puro: sin dependencias de navegador.

export enum Tipo {
   Entero = 'Entero',
   Real = 'Real',
   Logico = 'Logico',
   Caracter = 'Caracter',
   Cadena = 'Cadena',
   Nada = 'Nada',
   Desconocido = 'Desconocido'
 }

export function esNumerico(t: Tipo): boolean {
   return t === Tipo.Entero || t === Tipo.Real
 }

export function esBooleano(t: Tipo): boolean {
   return t === Tipo.Logico
}

export function esTexto(t: Tipo): boolean {
   return t === Tipo.Cadena || t === Tipo.Caracter
}

// --- Tokens ---

export type TipoToken =
   | 'PALABRA_CLAVE'
   | 'IDENT'
   | 'ENTERO'
   | 'REAL'
   | 'CADENA'
   | 'CARACTER'
   | 'SIMBOLO'
   | 'COMENTARIO'
   | 'EOF'

export interface Token {
   tipo: TipoToken
   texto: string
   line: number
   column: number
}

export type Severidad = 'error' | 'warning'

export interface Diagnostico {
   line: number
   column: number
   message: string
   code: string
   severity: Severidad
}

export interface ResultadoValidacion {
   correcto: boolean
   diagnosticos: Diagnostico[]
}

// --- AST ---

export interface NodoDeclaracion {
   t: 'declaracion'
   nombre: string
   tipo: string
   tok: Token
}

export interface NodoLeer {
   t: 'leer'
   nombre: string
   tok: Token
}

export interface NodoEscribir {
   t: 'escribir'
   args: Expr[]
   tok: Token
}

export interface NodoAsignacion {
   t: 'asignacion'
   nombre: string
   valor: Expr
   tok: Token
}

// Una llamada a función usada como sentencia (por sus efectos), no como valor:
// `menu()`. Es la forma natural de invocar una función `-> Nada` (D-Nada). A
// nivel de AST es exactamente una expresión 'llamada' (mismo nodo).
export interface NodoLlamada {
   t: 'llamada'
   nombre: string
   args: Expr[]
   tok: Token
}

export interface NodoSi {
   t: 'si'
   condicion: Expr
   cuerpoSi: Sentencia[]
   cuerpoSiNo: Sentencia[] | null
   tok: Token
}

export interface NodoMientras {
   t: 'mientras'
   condicion: Expr
   cuerpo: Sentencia[]
   tok: Token
}

export interface NodoRepetir {
   t: 'repetir'
   cuerpo: Sentencia[]
   condicion: Expr
   tok: Token
}

export interface NodoPara {
   t: 'para'
   variable: string
   inicial: Expr
   condicion: Expr
   cambio: Expr | null
   cuerpo: Sentencia[]
   tok: Token
}

export interface NodoCaso {
   t: 'caso'
   valor: Expr
   cuerpo: Sentencia[]
   tok: Token
}

export interface NodoSegun {
   t: 'segun'
   expresion: Expr
   casos: NodoCaso[]
   deOtroModo: Sentencia[] | null
   tok: Token
}

export type Sentencia =
   | NodoDeclaracion
   | NodoLeer
   | NodoEscribir
   | NodoAsignacion
   | NodoLlamada
   | NodoSi
   | NodoMientras
   | NodoRepetir
   | NodoPara
   | NodoSegun

export type Expr =
   | { t: 'numero'; valor: number; tipo: Tipo; tok: Token }
   | { t: 'cadena'; valor: string; tok: Token }
   | { t: 'caracter'; valor: string; tok: Token }
   | { t: 'literalBool'; valor: boolean; tok: Token }
   | { t: 'ident'; nombre: string; tok: Token }
   | { t: 'llamada'; nombre: string; args: Expr[]; tok: Token }
   | { t: 'unaria'; op: '!' | '-'; operando: Expr; tok: Token }
   | { t: 'binaria'; op: string; izq: Expr; der: Expr; tok: Token }
   | { t: 'par'; valor: Expr; tok: Token }

export interface NodoFuncion {
   t: 'funcion'
   nombre: string
   parametros: { nombre: string; tipo: string }[]
   tipoRetorno: string
   cuerpo: Sentencia[]
   tok: Token
}

export interface NodoAlgoritmo {
   t: 'algoritmo'
   nombre: string
   cuerpo: Sentencia[]
   tok: Token
}

export interface Astrogram {
   funciones: NodoFuncion[]
   algoritmo: NodoAlgoritmo | null
}

// Palabras clave reservadas (el lexer las clasifica como PALABRA_CLAVE).
// 'resultado' NO es reservada: es un identificador normal (variable especial
// del cuerpo de una función).
export const PALABRAS_CLAVE = new Set<string>([
   'Algoritmo','FinAlgoritmo','Funcion','FinFuncion','Declarar','Como',
   'Escribir','Leer','Si','Entonces','SiNo','FinSi','Segun','Hacer','DeOtroModo','FinSegun',
   'Mientras','FinMientras','Repetir','Para','FinPara','Cambio',
   'verdadero','falso','Entero','Real','Logico','Caracter','Cadena','Nada'
 ])
