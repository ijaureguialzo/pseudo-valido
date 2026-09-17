# G-01 · Lenguaje de pseudocódigo (gramática + semántica)

> **Estatus:** Baseline. Fuente de verdad: `docs/03_disenyo_algoritmos.pdf` (41 slides).
> **Tipo:** Especificación de dominio (SDD) — contrato del módulo validador.
> **Criterio de aceptación automático:** toda prueba de este documento debe pasar
> (`npm run test`); ver `specs/grammar/cases/` con los programas de prueba.
> **Nivel de análisis:** léxico + sintáctico + **semántico estricto**
> (tipado, flujo de control, alcance y no-asignaciones).
> **Sensibilidad a mayúsculas:** las palabras clave distinguen mayúsculas
> (caso exacto, como en el PDF). Los identificadores de usuario también distinguen.

## 1. Filosofía

Pseudocódigo textual de un solo programa, basado en PseInt y personalizado.
Todo el programa va envuelto en un bloque `Algoritmo … FinAlgoritmo`.
Las funciones pueden declararse antes o después del bloque principal; solo se
admiten un único `Algoritmo`/`FinAlgoritmo` (`S-322` si hay más de uno). La
indentación no es obligatoria sintácticamente (es legibilidad); el terminador
de sentencia es el **salto de línea**.

## 2. Léxico

### 2.1 Palabras clave (caso exacto)

```
Bloque principal:  Algoritmo   FinAlgoritmo
Función:           Funcion     FinFuncion
Declaración:       Declarar    Como    (variables y parámetros)
I/O:               Escribir    Leer
Alternativas:      Si          Entonces   SiNo   FinSi
                  Segun       Hacer      DeOtroModo   FinSegun
Repetitivas:       Mientras    FinMientras
                  Repetir
                  Para        Cambio
Literals booleanos: verdadero   falso
Tipos de datos:    Entero   Real   Logico   Caracter   Cadena   Nada
```

### 2.2 Símbolos / operadores

| Grupo | Símbolos |
|-------|----------|
| Asignación | `=` |
| Aritméticos | `+`  `-`  `*`  `/`  `%` |
| Relacionales | `>`  `<`  `>=`  `<=`  `==`  `!=` |
| Lógicos | `&&` (AND)  `||` (OR)  `!` (NOT) |
| Puntuación | `(`  `)`  `,`  `:`  `//` |

### 2.3 Tokens

- **Identificador:** `[A-Za-z_][A-Za-z0-9_]*` (distinción de mayúsculas).
- **Literal Entero:** `[0-9]+`.
- **Literal Real:** `[0-9]+\.?[0-9]*` con punto decimal (p. ej. `14.95`, `0.99`).
- **Literal Cadena:** texto delimitado por comillas dobles `"…"`.
- **Literal Caracter:** un carácter delimitado por comillas simples `'x'`.
- **Comentario:** `//` hasta fin de línea.
- **Sep:** espacios y tabulaciones (no significativos), salvo saltos de línea.

## 3. Gramática (EBNF)

```
Programa         ::= FuncionDef* Algoritmo FuncionDef*             ; el
                                                            Algoritmo es único (`S-322`)

FuncionDef       ::= "Funcion" Identificador "(" Parametros? ")"
                       "->" Tipo BloqueFuncion "FinFuncion"

Parametros       ::= "Declarar" Identificador "Como" Tipo
                        { "," "Declarar" Identificador "Como" Tipo }

Algoritmo        ::= "Algoritmo" Identificador Declaracion* Sentencia* "FinAlgoritmo"

BloqueFuncion    ::= Declaracion* Sentencia*                   ; cuerpo
                   ; el valor devuelto es el de la variable "resultado"

Declaracion      ::= "Declarar" Identificador "Como" Tipo

Tipo              ::= "Entero" | "Real" | "Logico" | "Caracter" | "Cadena" | "Nada"

Sentencia        ::= "Si" Expresion "Entonces" Bloque ("SiNo" Bloque)? "FinSi"
                   | "Segun" Expresion "Hacer" Caso* ["DeOtroModo" ":" Sentencia*] "FinSegun"
                   | "Mientras" Expresion "Hacer" Sentencia* "FinMientras"
                   | "Repetir" Sentencia* "Mientras" Expresion        ; do-while, cierre con "Mientras"
                   | "Para" Identificador "=" Expresion "Mientras" Expresion
                        ["Cambio" Expresion] "Hacer" Sentencia* "FinPara"
                   | Escribir
                   | Leer
                   | Declaracion
                   | Asignacion
                   | LlamadaFuncion                          ; llamada por sus efectos (típico de -> Nada)

Caso             ::= Expresion ":" Sentencia*

Escribir         ::= "Escribir" Expresion { "," Expresion }
Leer             ::= "Leer" Identificador                     ; un solo identificador
Asignacion       ::= Identificador "=" Expresion              ; LHS identificador simple

; --- Expresiones, de MAYOR precedencia (aprieta más) a MENOR ---
; ! > * / % > + - > < <= > >= > == != > && > || > =
Expresion        ::= ExpOr
ExpOr            ::= ExpAnd { "||" ExpAnd }
ExpAnd           ::= ExpIgual { "&&" ExpIgual }
ExpIgual         ::= ExpRel { ("==" | "!=") ExpRel }
ExpRel           ::= ExpSuma { (">" | "<" | ">=" | "<=") ExpSuma }
ExpSuma          ::= ExpFactor { ("+" | "-") ExpFactor }
ExpFactor        ::= ExpUnario { ("*" | "/" | "%") ExpUnario }
ExpUnario        ::= "!" ExpUnario | Primario
Primario         ::= "(" Expresion ")"
                   | LiteralEntero
                   | LiteralReal
                   | LiteralCadena
                   | LiteralCaracter
                   | "verdadero" | "falso"
                   | Identificador
                   | LlamadaFuncion

LlamadaFuncion   ::= Identificador "(" ArgList? ")"
ArgList          ::= Expresion { "," Expresion }
```

### 3.1 Reglas ortográficas / casos de cierre

- `Repetir … Mientras` es **do-while**: su cuerpo se ejecuta una vez siempre; la
  condición de salida va al final con `Mientras` y **no** tiene palabra de cierre.
- `Para i = a Mientras c Cambio e Hacer … FinPara`: bucle "n→m". `Cambio e` es
  **opcional**; si se omite, el bucle no actualiza el contador (posible bucle
  infinito; ver M-018).
- `Segun … Hacer`: cada caso es `expresión : sentencias`. Si no hay coincidencia
  y no existe `DeOtroModo:`, la sección no ejecuta nada.
- Las funciones se declaran **antes** del bloque principal; el cuerpo va entre
  `Funcion` y `FinFuncion`.

## 4. Reglas semánticas (análisis estricto)

Tres pases en orden devuelven una lista de diagnóstico
(`Diagnostico { line, column, message, code, severity }`). La severidad `error`
impide que el programa sea "correcto"; `warning` no.

### 4.1 Léxico
- **L-001** Token no reconocido (carácter que no forma ningún token).
- **L-003** Literal de cadena sin cerrar (`"` sin cierre en la línea).
- **L-004** Literal de carácter con longitud ≠ 1.
- **L-005** Identificador que empieza por dígito.
- **L-006** Espacio en el interior de un número decimal (`1 2`).

### 4.2 Sintáctico
- **S-001** Programa vacío / no empieza con `Algoritmo` o `Funcion`.
- **S-002** `Algoritmo` sin `FinAlgoritmo` de cierre.
- **S-003** `Funcion` sin `FinFuncion` de cierre.
- **S-004** `Si` sin `FinSi` de cierre.
- **S-005** `Mientras … Hacer` sin `FinMientras`.
- **S-006** `Para … Hacer` sin `FinPara`.
- **S-007** `Segun … Hacer` sin `FinSegun`.
- **S-008** `Repetir` sin `Mientras` de cierre.
- **S-009** `SiNo` en un `Si` sin `Entonces`.
- **S-010** `FinSi`/`FinMientras`/`FinPara`/`FinSegun`/`FinFuncion` sin su apertura.
- **S-011** `Hacer` sin `Mientras`/`Para`/`Segun` que lo preceda.
- **S-012** `Escribir`/`Leer` sin operando.
- **S-013** LHS de `=` que no es un identificador simple.
- **S-014** `Para` sin `=` inicial.
- **S-015** `Segun` sin `Hacer`.
- **S-016** `Declarar` fuera de su contexto (nómina de declaración o parámetro).
- **S-017** Operador binario sin operando de derecha.
- **S-018** Paréntesis desparejado.
- **S-019** Token inesperado (con token esperado).
- **S-020** `Cambio` sin `Para` asociado.
- **S-021** `DeOtroModo:` sin `Segun` de cierre.
- **S-322** Segundo `Algoritmo` principal (solo se admite uno; ver EBNF `Programa`).

### 4.3 Semántico (estricto)
- **M-001** Variable usada sin declarar en el contexto.
- **M-002** Variable declarada dos veces en el mismo contexto.
- **M-003** Variable usada antes de su inicialización (no-asignación).
- **M-004** `Leer` sobre identificador no declarado.
- **M-005** Tipo inválido en `Declarar … Como`.
- **M-006** Tipo inválido en el parámetro de una función (`Declarar … Como`).
- **M-007** Tipo de retorno no coincide con el tipo de `resultado`.
- **M-008** `resultado` no asignado en alguna trayectoria (no-asignación).
- **M-009** Parámetro de función con tipo distinto al de la llamada. La llamada
  usa la **misma regla estricta** que la asignación (`M-016`): un parámetro
  `Entero` solo admite un argumento `Entero` (un `Real` ensanchado **no** es
  válido), `Real` admite cualquier tipo numérico, y los demás tipos exigen
  coincidencia exacta. Por tanto `sumar(5, 5.7)` frente a un parámetro `Entero`
  **dispara M-009** y `sumar(5, 5)` no.
- **M-010** Tipo de expresión incoherente con el operando esperado (p.ej. `&&` no-`Logico`).
- **M-011** Variable de control de `Para` usada fuera del ciclo.
- **M-012** Llamada a función no definida.
- **M-013** Llamada con nº de argumentos distinto al esperado.
- **M-014** Llamada donde se espera que devuelva valor y no lo hace.
- **M-015** Recursión no declarada (`resultado` en su propia definición).
- **M-016** Tipo de expresión incompatible con la variable de destino (asignación / `resultado` / inicial de `Para`) sin conversión.
- **M-017** Variable declarada y nunca usada *(warning)*.
- **M-018** `Para` sin `Cambio` con condición fija → posible bucle infinito *(warning)*.
- **M-019** Operador aritmético en tipos no-numéricos.
- **M-020** Relacional entre numérico y cadena/caracter.
- **M-021** Función declarada y nunca llamada *(warning)*.
- **M-022** Variable de control de `Para` como parámetro (efecto lateral).
- **M-023** Literal `Logico` en contexto numérico.
- **M-024** `Cambio` de `Para` con expresión no-numérica.
- **M-025** Función declarada dos veces con el mismo nombre (ver `D-redef`).
- **M-026** `resultado` aparece (asignado, usado en expresión o **declarado**
  con `Declarar resultado Como …`) en el cuerpo de una función cuyo tipo de
  retorno es `Nada`: la variable que recoge el valor devuelto no existe, por lo
   que su aparición es un error (ver **D-Nada**).

### 4.4 Tipos
- `Entero`/`Real` se subsumen en "numérico"; `+ - * / %` exigen numérico; `%` exige `Entero` en ambos lados.
- `Logico` con `&&` `||` `!`; ambos operandos `Logico`.
- `Cadena`/`Caracter`: solo `+` (concatenación) y `==`/`!=` entre tipos homogéneos.
- `> < >= <=` válidos entre numéricos; incoherentes entre numérico y cadena.
- **Asignación estricta (M-016):** un valor solo se admite en una variable si ambos tipos son
  numéricos (un `Entero` ensancha a `Real`) o son idénticos. `Resultado`, el valor inicial de
  `Para` y la expresión de `Cambio` obedecen la misma regla (en `Para`, el valor de control es
  `Entero`: su inicial y su `Cambio` deben ser numéricos, o se dispara M-016 / M-024).
  No hay conversión implícita ni coerción (ver **D7**): `x = 7` con `x: Cadena` es M-016.
- `Desconocido` (tipo no inferible) se tolera: no produce M-016.
- **Alcance de parámetros (D-alcance):** el ámbito de un parámetro es **la
  función que lo declara**; no se expone al programa principal. Por tanto un
  identificador que comparte nombre con un parámetro de `sumar` (p. ej. `a` o
  `b`) debe **declararse** en el propio `Algoritmo` antes de usarse; su ausencia
  es **M-001**.
- **Redefinición de funciones (D-redef):** cada función se declara **una sola
  vez** con su nombre. Dos declaraciones con el mismo nombre constituyen un
  error **M-025** (no se aplica M-002, que es interno al contexto de variables).
  Solo se admite un único `Algoritmo` (`S-322`).

## 5. Formato de diagnóstico

```json
{
   "line": 3,
   "column": 5,
   "message": "Variable 'foo' no declarada en el alcance actual.",
   "code": "M-001",
   "severity": "error"
}
```

- `line`/`column`: **1-indexadas** sobre el texto del editor.
- `column` = primer carácter del token ofensivo (o inicio de la construcción ofensiva).
- `severity`: `error` (bloquea) o `warning` (informativo).

## 6. Casos de prueba fijos (golden)

Cada programa está en `specs/grammar/cases/`. La prueba de aceptación compara
la salida del validador contra `expected.diagnosticos.json` (orden por
`line`, `column`, `code`) y contra `expected.correcto` (`true`/`false`).

| Fichero | Esperado |
|---------|----------|
| `01-hola-ok.pse` | `correcto=true`, 0 diagnósticos |
| `02-variables-ok.pse` | `correcto=true` |
| `03-tipos-ok.pse` | `correcto=true` |
| `04-escribir-leer-ok.pse` | `correcto=true` |
| `05-expresiones-ok.pse` | `correcto=true` |
| `06-si-ok.pse` | `correcto=true` |
| `07-segun-ok.pse` | `correcto=true` |
| `08-mientras-ok.pse` | `correcto=true` |
| `09-repetir-ok.pse` | `correcto=true` |
| `10-para-ok.pse` | `correcto=true` |
| `11-funcion-ok.pse` | `correcto=true` |
| `12-funcion-llamada-ok.pse` | `correcto=true` |
| `13-si-falt-fin.pse` | `correcto=false`, S-004 |
| `14-var-usada-p.pse` | `M-001` |
| `15-var-doble.pse` | `M-002` |
| `16-tipo-incompat.pse` | `M-010` |
| `17-para-infinito.pse` | `M-018` (warning) |
| `18-funcion-recursiva.pse` | `M-015` |
| `19-no-inicializada.pse` | `M-003` |
| `20-var-asign-p.pse` | `M-001` (asignar a variable no declarada) |
| `21-leer-no-declarada.pse` | `M-004` (`Leer` sobre variable no declarada) |
| `22-ent-cadena.pse` | `M-016` |
| `23-cadena-ent.pse` | `M-016` |
| `24-cadena-log.pse` | `M-016` |
| `25-ent-real-ok.pse` | `correcto=true` (Entero → Real es compatible) |
| `26-para-no-num.pse` | `M-016` + `M-018` |
| `27-llamada-tipo.pse`   | `M-009` (tipo de argumento distinto al parámetro) |
| `28-llamada-num-args.pse`|`M-013` (nº de argumentos distinto) |
| `29-funcion-despues.pse` | `correcto=true` (la función va después del Algoritmo) |
| `30-dos-algoritmos.pse` | `S-322` (segundo `Algoritmo` no permitido) |
| `31-llamada-real.pse`    | `M-009` (arg. `Real` no encaja en parámetro `Entero`) |
| `32-param-visibles.pse`  | `M-001` ×2 (`a`/`b` de `sumar` no visibles en el principal) |
| `33-funcion-redefin.pse` | `M-025` (función `sumar` declarada dos veces) |
| `34-funcion-nada-resultado.pse` | `M-026` (`resultado = 1` en función `-> Nada`) |
| `35-funcion-nada-ok.pse` | `correcto=true` (función `-> Nada` sin `resultado`) |
| `36-funcion-nada-declarar-resultado.pse` | `M-026` (`Declarar resultado Como …` en función `-> Nada`) |
| `37-funcion-nada-llamada.pse` | `correcto=true` (llamada solitaria `menu()` a función `-> Nada`, función tras el Algoritmo) |

## 7. Decisiones de diseño (fijadas)

- **D1.** Sensibilidad a mayúsculas en palabras clave → **caso exacto**.
- **D2.** `Repetir … Mientras` → **do-while** (cuerpo una vez, cierre con `Mientras`).
- **D3.** `Para i = a Mientras c Cambio e Hacer` → **for** con paso opcional.
- **D4.** `FinPara` y `FinMientras` → **sí** cierran.
- **D5.** Funciones → **sí** soportadas: `Funcion f(Declarar p Como T) -> T … FinFuncion`
  (los parámetros se declaran con la misma palabra clave `Declarar`, sin una
  palabra reservada distinta).
- **D6.** Tipos: `Entero`, `Real`, `Logico`, `Caracter`, `Cadena`, `Nada`.
- **D7.** Coerción implícita en `+` entre `Cadena` y numérico → **no** (error M-019/020).
- **D8.** `Leer` admite un único identificador.
- **D9.** El validador es un **módulo puro** (sin I/O), testeable en Node.
- **D10.** La UI persiste archivos en **localStorage** del navegador.
- **D11.** La función puede quedar antes **o** después del `Algoritmo`; solo se
  admite **un** `Algoritmo` (`S-322` en caso contrario), y hay 0..n funciones en
  cualquier orden. En una llamada se validan nº de argumentos (`M-013`) y tipo por
  argumento frente al parámetro (`M-009`), con la **misma regla estricta** que
  la asignación (`M-016`): un parámetro `Entero` no admite `Real` ensanchado.
  Los parámetros **no se exponen** fuera de su propia función (`D-alcance`; su
  ausencia en el principal es `M-001`), y cada función se declara **una sola
  vez** (`D-redef`; una redefinición es `M-025`). Una función puede declarar
  `-> Nada` (función sin valor de retorno); en ese cuerpo `resultado` es
   **prohibido** (su aparición es `M-026`; ver **D-Nada**).
- **D-Nada.** `Nada` es el tipo de retorno de una función que no aporta valor
  a su llamador. En la gramática, `Funcion f (…) -> Nada … FinFuncion`. En el
  cuerpo **no existe** la variable especial `resultado` (ya sea asignada en
   expresión, usada como operando de `Escribir`, o declarada con `Declarar
   resultado Como …`); su aparición es `M-026`. La llamada a tal función se hace
   **como sentencia por sus efectos** —`menu()`—, no recogiendo valor
   (`LlamadaFuncion` como `Sentencia`).

## 8. Criterio de aceptación global

1. La suite de `vitest` pasa en verde para los 37 casos golden (§6).
2. Todo código nuevo tiene al menos una prueba que lo justifica (ratio ≥ 90% línea en `src/validador/`).
3. El editor muestra los diagnósticos con línea/columna en el gutter y en un panel.
4. Los archivos persisten en `localStorage`; al recargar, la lista y el activo se restauran.
5. `npm run build` genera un bundle servible sin errores.
