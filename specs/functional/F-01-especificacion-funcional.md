# F-01 · Especificación funcional (SDD)

> **Estatus:** Baseline. Complementa `G-01` (nível de lenguaje) con el nivel de
> aplicación. **Fuente de verdad de la sintaxis:** `G-01-lenguaje-pseudocodigo.md`.
> **Criterio de aceptación:** `npm run test` en verde y `npm run build` exitoso.

## 1. Visión

`pseudo-valido` es una **SPA** que permite a un estudiante escribir, guardar y
validar pseudocódigo (gramática de `G-01`). La aplicación no ejecuta el
pseudocódigo, solo lo **valida** (léxico, sintáctico y semántico estricto).

## 2. Actores

- **Estudiante:** crea/abre/edita/borra archivos de pseudocódigo y ve los
  resultados de validación en vivo.
- **Profesor:** (fuera de alcance V0) podría compartir archivos — no implementado.

## 3. Casos de uso

### UC-01 · Crear un nuevo archivo
- **Pre:** la app está lista.
- **Flujo:** el estudiante pulsa "Nuevo"; se crea un archivo con nombre
  único (`sin-titulo-1.pse`, etc.), se selecciona y se abre en el editor.
- **Salida:** el archivo aparece en la lista; su contenido se persiste en
  `localStorage`.

### UC-02 · Renombrar un archivo
- **Flujo:** doble-click (o botón) en un elemento de la lista → prompt de nombre.
- **Salida:** el nombre actualiza; si colisiona, se rechaza con aviso.

### UC-03 · Borrar un archivo
- **Flujo:** selecciona + botón "Eliminar" → confirmación.
- **Salida:** el archivo se remove; si era el activo, se abre el siguiente o se
  crea uno nuevo.

### UC-04 · Seleccionar un archivo
- **Flujo:** click en un elemento de la lista.
- **Salida:** el editor carga su contenido; los diagnósticos se recalculan.

### UC-05 · Validar (automático, en vivo)
- **Flujo:** el estudiante escribe/pega texto.
- **Salida:** el módulo validador devuelve la lista de diagnósticos; el editor
  los muestra en el gutter y en un panel inferior/lateral.

### UC-06 · Ver resultado de validación
- **Flujo:** la app muestra badge "OK" si no hay errores `error`, o "N errores,
  M avisos" si los hay.
- **Salida:** clic en un diagnóstico lleva el cursor a la línea/columna.

### UC-07 · Persistir entre sesiones
- **Flujo:** el estudiante cierra la app y la abre después.
- **Salida:** los archivos y el activo se restauran desde `localStorage`.
- **Nota:** si `localStorage` no está disponible, la app sigue funcionando en
  memoria (con un aviso).

## 4. Requisitos

- **R-01** (obligatorio) — UI de dos paneles: lista izquierda, editor derecha.
- **R-02** — Validación en vivo con debounce ~300 ms para no recargar el lexer.
- **R-03** — Diagnósticos con línea y columna (1-indexados, ver G-01 §5).
- **R-04** — El módulo validador es **pu**ro** (sin I/O, sin dependencias de navegador); se ejecuta en el worker/pipeline con debounce.
- **R-05** — El editor de código usa **CodeMirror 6** (extensible, gutter de errores, resaltado).
- **R-06** — Los archivos se guardan en `localStorage` con una clave estable
  (`pseudo-valido/files`) y el activo activo con `pseudo-valido/active`.
- **R-07** — El validador expone: `validar(texto): Diagnostico[]`.
- **R-08** — La UI es responsiva pero el caso de diseño es escritorio (≥ 1024 px).
- **R-09** — Teclado/teclado: Ctrl+Enter o botón "Validar" para forzar la validación inmediata.
- **R-10** — Los nombres de archivo son **puros** (sin ruta, sin extensión obligatoria); se sugiere `.pse` pero no es obligatorio.
- **R-11** — Cuando hay 0 archivos, la app crea uno por defecto al abrir.

## 5. No requerimientos (V0)

- No hay ejecución/interpretación del pseudocódigo.
- No hay multiusuario/colaboración.
- No hay import/export a disco (solo `localStorage`).
- No hay i18n (texto en español).
- No hay dark mode (opcional V1).

## 6. Criterio de aceptación (resumen)

1. `npm run test` en verde (≥ 19 casos golden de `G-01` §6 + tests de UI).
2. `npm run build` genera `dist/` sin errores.
3. Al recargar, la lista y el archivo activo se restauran desde `localStorage`.
4. Escribir sintaxis errónea muestra el diagnóstico con línea/columna en el gutter y en el panel.
