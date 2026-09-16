// G-01 · Listado completo de códigos de error léxico, sintáctico y semántico.
export type Severidad = 'error' | 'warning'

export interface ErrorDef {
   descripcion: string   
   severity: Severidad 
}

export const ERRORS: Record<string, ErrorDef> = {
    // === LÉXICO (6 errores) ===
    'L-001': { descripcion: 'Token no reconocido', severity: 'error' },
    'L-002': { descripcion: 'Literal de carácter sin cerrar', severity: 'error' },
    'L-003': { descripcion: 'Literal de cadena sin cerrar', severity: 'error' },   
    'L-004': { descripcion: 'Literal de carácter con longitud ≠ 1', severity: 'error' },
    'L-005': { descripcion: 'Identificador que empieza por dígito', severity: 'error' },
    'L-006': { descripcion: 'Espacio en el interior de un número decimal', severity: 'error' },
    
    // === SINTÁCTICO (21 errores) ===  
    'S-001': { descripcion: 'Programa vacío / no empieza con Algoritmo o Funcion', severity: 'error' },
    'S-002': { descripcion: 'Algoritmo sin FinAlgoritmo de cierre', severity: 'error' },
    'S-003': { descripcion: 'Funcion sin FinFuncion de cierre', severity: 'error' },
    'S-004': { descripcion: 'Si sin FinSi de cierre', severity: 'error' },
    'S-005': { descripcion: 'Mientras ... Hacer sin FinMientras', severity: 'error' },
    'S-006': { descripcion: 'Para ... Hacer sin FinPara', severity: 'error' },  
    'S-007': { descripcion: 'Segun ... Hacer sin FinSegun', severity: 'error' },
    'S-008': { descripcion: 'Repetir sin Mientras de cierre', severity: 'error' },
    'S-009': { descripcion: 'SiNo en un Si sin Entonces', severity: 'error' },
    'S-010': { descripcion: 'FinSi/FinMientras/FinPara/FinSegun/FinFuncion sin su apertura', severity: 'error' },
    'S-011': { descripcion: 'Hacer sin Mientras/Para/Segun que lo preceda', severity: 'error' },
    'S-012': { descripcion: 'Escribir/Leer sin operando', severity: 'error' },
    'S-013': { descripcion: 'LHS de = que no es un identificador simple', severity: 'error' },
    'S-014': { descripcion: 'Para sin = inicial', severity: 'error' },
    'S-015': { descripcion: 'Segun sin Hacer', severity: 'error' },
    'S-016': { descripcion: 'Definir usada fuera de Parametros/Declarar', severity: 'error' },
    'S-017': { descripcion: 'Operador binario sin operando de derecha', severity: 'error' },  
    'S-018': { descripcion: 'Paréntesis desparejado', severity: 'error' },  
    'S-019': { descripcion: 'Token inesperado (con token esperado)', severity: 'error' },
    'S-020': { descripcion: 'Cambio sin Para asociado', severity: 'error' },
    'S-021': { descripcion: 'DeOtroModo: sin Segun de cierre', severity: 'error' },

    // === SEMÁNTICO (24 errores) — solo los que tienen severidad different ===  
    'M-001': { descripcion: 'Variable usada sin declarar en el contexto', severity: 'error' },
    'M-002': { descripcion: 'Variable declarada dos veces en el mismo contexto', severity: 'error' },
    'M-003': { descripcion: 'Variable usada antes de su inicialización (no-asignación)', severity: 'error' },
    'M-004': { descripcion: 'Leer sobre identificador no declarado', severity: 'error' },
    'M-005': { descripcion: 'Tipo inválido en Declarar ... Como', severity: 'error' },  
    'M-006': { descripcion: 'Tipo inválido en Definir ... Como', severity: 'error' },  
    'M-007': { descripcion: 'Tipo de retorno no coincide con el tipo de resultado', severity: 'error' },
    'M-008': { descripcion: 'Resultado no asignado en alguna trayectoria (no-asignación)', severity: 'error' },
    'M-009': { descripcion: 'Parámetro de función con tipo distinto al de la llamada', severity: 'error' },  
    'M-010': { descripcion: 'Tipo de expresión incoherente con el operando esperado', severity: 'error' },
    'M-011': { descripcion: 'Variable de control de Para usada fuera del ciclo', severity: 'error' },  
    'M-012': { descripcion: 'Llamada a función no definida', severity: 'error' },
    'M-013': { descripcion: 'Llamada con nº de argumentos distinto al esperado', severity: 'error' },
    'M-014': { descripcion: 'Llamada donde se espera que devuelva valor y no lo hace', severity: 'error' },  
    'M-015': { descripcion: 'Recursión no declarada (resultado en su propia definición)', severity: 'error' },
    'M-016': { descripcion: 'Literal incompatible con el tipo de destino sin conversión', severity: 'error' },   
    'M-017': { descripcion: 'Variable declarada y nunca usada', severity: 'warning' },  
    'M-018': { descripcion: 'Para sin Cambio con condición fija → posible bucle infinito', severity: 'warning' },
    'M-019': { descripcion: 'Operador aritmético en tipos no-numéricos', severity: 'error' },  
    'M-020': { descripcion: 'Relacional entre numérico y cadena/caracter', severity: 'error' },
    'M-021': { descripcion: 'Función declarada y nunca llamada', severity: 'warning' },  
    'M-022': { descripcion: 'Variable de control de Para como parámetro (efecto lateral)', severity: 'error' },  
    'M-023': { descripcion: 'Literal Logico en contexto numérico', severity: 'error' },
    'M-024': { descripcion: 'Cambio con expresión no-numérica', severity: 'error' },
}

export function getErrorDef(code: string): ErrorDef | null {
    return ERRORS[code] ?? null
}
