import { lexear } from '../../validador/lexico'

// Palabras clave que cierran un bloque al inicio de una línea.
const CIERRES = new Set([
   'FinAlgoritmo', 'FinFuncion', 'FinSi', 'FinMientras', 'FinPara', 'FinSegun',
])

/**
 * Recorta espacio en blanco a la derecha de cada línea y recoloca el tabulado
 * (2 espacios por nivel de anidamiento) para mejorar la legibilidad del
 * pseudocódigo.
 *
 * Es un reformateador de MEJOR ESFUERZO: tolera programas con errores de
 * sintaxis (nunca lanza) y es IDEMPOTENTE — `formatear(formatear(x)) ===
 * formatear(x)` — porque solo depende de la estructura de tokens, no de los
 * espacios que ya había.
 *
 * Convención de anidamiento (la misma que los casos golden): los cierres se
 * alinean al nivel del bloque que abrieron, y cada cuerpo va un nivel (2
 * espacios) más adentro.
 *   - Abren un cuerpo: 'Algoritmo'/'Funcion'/'Repetir', y cualquier línea que
 *     acabe con 'Entonces' (Si) o 'Hacer' (Mientras/Para/Segun). 'SiNo' cierra
 *     la rama anterior y abre la nueva (quedan a igual nivel que 'Si'/'FinSi').
 *   - Cierran: 'FinX' (un nivel menos), y la condición de salida de un 'Repetir'
 *     ('Mientras …' sin 'Hacer' en la línea).
 *   - 'DeOtroModo:' y los casos 'X:' de 'Segun' se emiten al nivel de los casos,
 *     sin anidar a mayores.
 */
export function formatear(texto: string): string {
  const normalizado = (texto ?? '').replace(/\r\n?/g, '\n')
  const terminabaConLF = normalizado.endsWith('\n')
  const lineas = normalizado.split('\n')
  if (terminabaConLF && lineas.length &&
      lineas[lineas.length - 1] === '') {
      lineas.pop()
     }

   // Tokens de código agrupados por línea (se ignoran comentarios y EOF para la
   // detección de bloques), conservando las líneas originales —con su contenido—
   // para reescribirlas tocando únicamente la sangría de cabecera.
  const { tokens } = lexear(texto)
  const porLinea = new Map<number, { primero: string; ultimo: string; tokens: string[] }>()
  for (const tk of tokens) {
    if (tk.tipo === 'EOF' || tk.tipo === 'COMENTARIO') continue
    const info = porLinea.get(tk.line)
    if (!info) porLinea.set(tk.line, { primero: tk.texto, ultimo: tk.texto, tokens: [tk.texto] })
    else {
       info.ultimo = tk.texto
       info.tokens.push(tk.texto)
        }
     }

  let nivel = 0            // sangría (nº de unidades) de la próxima línea a emitir
  let enRepetir = 0       // nº de 'Repetir' abiertos sin cerrar (control de anidamiento)
  const salida: string[] = []

  for (let i = 0; i < lineas.length; i++) {
    const recortada = lineas[i].replace(/\s+$/, '')
    if (recortada.trim() === '') {
     salida.push('')            // línea vacía: se conserva sin contenido
      continue
       }

    const info = porLinea.get(i + 1)
    const primero = info?.primero ?? ''
    const ultimo = info?.ultimo ?? ''
    const enLinea = info?.tokens ?? []
    const tieneHacer = enLinea.includes('Hacer')

     // 1) Cierre de inicio de línea: cada uno rebaja un nivel.
    let cierre = 0
    if (CIERRES.has(primero)) {
       cierre = 1
       } else if (primero === 'SiNo') {
       cierre = 1                 // cierra la rama 'Entonces'
       } else if (primero === 'Mientras' && !tieneHacer) {
       // 'Mientras' sin 'Hacer' es la condición de SALIDA de un 'Repetir'.
       cierre = 1
       if (enRepetir > 0) enRepetir -= 1
        }
    nivel = Math.max(0, nivel - cierre)

     // 2) Se emite a nivel ya calculado.
    salida.push(' '.repeat(2 * nivel) + recortada.trimStart())

     // 3) Apertura de cuerpo: sube el nivel de la línea siguiente.
    let apertura = 0
    if (primero === 'SiNo') {
       apertura = 1              // abre el cuerpo 'SiNo' (la línea quedó en su nivel)
       } else if (primero === 'Algoritmo' || primero === 'Funcion') {
       apertura = 1
       } else if (primero === 'Repetir') {
       apertura = 1
       enRepetir += 1
       } else if (ultimo === 'Entonces' || ultimo === 'Hacer') {
       apertura = 1
        }
    nivel += apertura
      }

  const resultado = salida.join('\n')
  return terminabaConLF ? resultado + '\n' : resultado
}
