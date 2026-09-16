# Plan de implementación · pseudo-valido

> **Para Hermes:** ejecutar con `subagent-driven-development` (un subagente por
> tarea, con revisión en dos fases: cumplimiento de spec → calidad de código).
> Cada tarea se hace en **TDD estricto**: test que falla → ver falla → código
> mínimo → ver pasa → suite completa verde → commit. No se avanza a la siguiente
> tarea mientras haya un test rojo o una revisión con issues abiertos.

**Objetivo.** SPA Vue 3 que edita pseudocódigo y lo **valida** (léxico + sintáctico
+ semántico estricto) según `specs/grammar/G-01`, con gestor de archivos en
`localStorage` en el panel izquierdo y el editor (CodeMirror 6) en el derecho.

**Arquitectura.** El validador es un **módulo puro de TypeScript** sin dependencias
de navegador (`src/validador/`), 100% testeable en Node/Vitest. La UI es fina y
delega toda la lógica en ese módulo. Persistencia con `localStorage`.

**Stack.** Vite 5 · Vue 3 `<script setup>` · TypeScript 5 · Vitest · happy-dom ·
CodeMirror 6 · Pinia (opcional; se decide en T-10).

**Convenios de git.** Autor: `Ion Jaureguialzo Sarasola <ion@jaureguialzo.com>`;
co-autor `Hermes Agent`. Conventional commits. Commit **después de cada tarea**.

---

## Convención de las tareas de TDD

Cada tarea con código sigue siempre estos 5 pasos:
1. **Test que falla** — escribe la prueba mínima en `tests/…`.
2. **Ver la falla** — `npx vitest run <archivo>` → debe fallar por "no existe / no pasa".
3. **Código mínimo** — lo justo para que pase.
4. **Ver el paso** — `npx vitest run <archivo>` → PASS.
5. **Commit** — `git add -A && git commit -m "…(T-XX)"`.

Al final de cada tarea: `npx vitest run` (todo la suite) debe estar verde.

## Estructura de archivos objetivo

```
pseudo-valido/
├─ specs/            (SDD, ya creada)
│  ├─ grammar/G-01-lenguaje-pseudocodigo.md
│  ├─ functional/F-01-especificacion-funcional.md
│  └─ grammar/cases/ (19 ficheros .pse + expected di
agnósticos JSON)
├─ docs/plans/2026-09-15-pseudo-valido.md
├─ src/
│   ├─ main.ts
│   ├─ App.vue
│   └─ validador/
│       ├─ tipos.ts              (Tipos, Token, AST, Diagnostico)
│       ├─ lexico.ts             (Léxico → Token[])
│       ├─ sintactico.ts        (Parser → AST)
│       ├─ semantico.ts         (Type checker, no-asignación, alcance)
│       ├─ diagnosticos.ts      (códigos L/S/M + localizadores)
│       └─ index.ts             (API: validar(texto) → Diagnostico[])
├─ src/ui/
│   ├─ componentes/
│   │   ├─ ListaArchivos.vue
│   │   ├─ EditorCodigo.vue
│   │   ├─ PanelDiagnosticos.vue
│   │   └─ BarraEstado.vue
│   ├─ composables/
│   │   ├─ useArchivos.ts        (gestor + localStorage)
│   │   └─ useValidacion.ts      (validate + debounce)
│   └─ store/                    (Pinia opcional)
├─ tests/
│   ├─ validador/
│   │   ├─ lexico.spec.ts
│   │   ├─ sintactico.spec.ts
│   │   ├─ semantico.spec.ts
│   │   └─ validador.spec.ts     (golden cases)
│   └─ ui/
│       ├─ ListaArchivos.spec.ts
│       ├─ useArchivos.spec.ts
│       └─ App.spec.ts
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
└─ vitest.config.ts
```

## Fase 0 · Preparación del repositorio

### T-01 · Inicializar la estructura del proyecto
**Objetivo:** repositorio listo para `npm install` sin errores.
**Pasos:**
1. `mkdir -p src src/validador src/ui src/ui/componentes src/ui/composables
   tests/validador tests/ui specs/grammar/cases docs/plans`
2. `git add -A && git commit -m "chore: estructura base del proyecto (T-01)"`
**Verificación:** `ls -R src tests specs` → directorios creados.

### T-02 · Crear `package.json` con dependencias
**Objetivo:** `npm install` exito
so.
**Archivo:** `package.json`
**Pasos (TDD no aplica a config; se verifica con `npm install` y un test trivial):**
```json
{
  "name": "pseudo-valido",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "lint": "eslint ."
  },
  "dependencies": {
    "vue": "^3.5.0",
    "@codemirror/state": "^6.5.0",
    "@codemirror/view": "^6.34.0",
    "@codemirror/language": "^6.10.0",
    "@codemirror/commands": "^6.6.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vue": "^3.5.0",
    "@vitejs/plugin-vue": "^5.1.0",
    "typescript": "^5.6.0",
    "vue-tsc": "^2.1.0",
    "vitest": "^2.1.0",
    "happy-dom": "^15.0.0",
    "@vue/test-utils": "^2.4.0",
    "jsdom": "^25.0.0",
    "@vitest/coverage-v8": "^2.1.0"
  }
}
```
**Verificación:** `npm install` → exit 0; `npx vitest --version` → salida.
**Commit:** `git commit -m "chore: package.json con deps Vue3+Vite+Vitest+CodeMirror (T-02)"`

### T-03 · Configurar Vite, TypeScript y Vitest
**Objetivos:** `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `index.html`, `src/main.ts`, `src/App.vue` mínimo.
**Files:**
- `vite.config.ts` con `@vitejs/plugin-vue` y test env `happy-dom`.
- `tsconfig.json` con `strict: true`, `target: ES2020`, `module: ESNext`.
- `index.html` con `<div id="app">` + carga de `main.ts`.
**Test trivial:** `tests/ui/App.spec.ts` monta `App.vue` y as

ereta que exista.
**Verificación:** `npx vitest run` → 1 passed.
**Commit:** `git commit -m "chore: config Vite/TS/Vitest (T-03)"`

### T-04 · Crear los 19 casos golden
**Archivo:** `specs/grammar/cases/*.pse` + `*.expected.json`.
**Pasos:** crear los 19 ficheros descritos en G-01 §6 con su `expected`
(`correcto` + `diagnosticos`). Sin código de implementación aún.
**Verificación:** `ls specs/grammar/cases | wc -l` = 38 (19 + 19).
**Commit:** `git commit -m "test: 19 casos golden de aceptación (T-04)"`

## Fase 1 · Módulos del validador (núcleo, TDD estricto)

Los pases se construyen **de abajo hacia arriba** y cada uno tiene su propia suite.
La regla de oro del TDD aquí: cada nueva función del validador nace con un test
que la hace **fallar**, se ve esa falla, y solo entonces se escribe el código.

### T-10 · Tipos de datos del validador (`tipos.ts`)
**Files:** `src/validador/tipos.ts`, `tests/validador/tipos.spec.ts`
**Test que falla (TDD):**
```ts
import { Tipo } from '../../src/validador/tipos'
test('Tipo tiene Entero,Real,Logico,Caracter,Cadena', () => {
  expect(Object.values(Tipo)).toEqual(['Entero','Real','Logico','Caracter','Cadena'])
})
test('esNumerico(Entero) = true, esNumerico(Cadena) = false', () => {
  expect(esNumerico(Tipo.Entero)).toBe(true)
  expect(esNumerico(Tipo.Cadena)).toBe(false)
})
```
**Implementación mínima:** `enum Tipo`, `esNumerico`, `esBooleano`.
**Ver:** `npx vitest run tests/validador/tipos.spec.ts` → PASS.
**Commit:** `git commit -m "feat(validador): tipos de dato (T-10)"`

### T-11 · Modelo de Token + Lexer (`lexico.ts`)
**Files:** `src/validador/tipos.ts` (agregar Token), `src/validador/lexico.ts`, `tests/validador/lexico.spec.ts`
**Test que falla (TDD):**
```ts
test('tokeniza palabras clave y símbolos', () => {
  const t = lexear('Algoritmo Hola // c\nFinAlgoritmo')
  expect(t[0].texto).toBe('Algoritmo')
  expect(t.every(x => 'linea' in x)).toBe(true)   // línea y columna 1-indexadas
})
test('comentario de línea se ignora pero la línea se preserva', () => {
  const t = lexear('Escribir "x" // comentario')
  expect(t.some(x => x.tipo === 'COMENTARIO') || !t.some(x => x.tipo === 'ID' && x.texto==='comentario')).toBe(true)
})
test('detecta carácter no reconocido (L-001)', () => {
  expect(lexear('@').errores.length).toBe(1)
})
```
**Implementación mínima:** lexer que emite `Token{tipo,texto,linea,columna}` y
lista de errores `L-001..L-006`. Casos especiales: cadenas `"…"`, caracteres
`'x'`, números enteros/reales, `&& || >= <= == != ->`, `//` hasta fin de línea.
**Ver:** suite `lexico.spec.ts` → PASS; `npx vitest run` (todo) → verde.
**Commit:** `git commit -m "feat(validador): lexer con lineas/columnas (T-11)"`

### T-12 · Parser a AST (`sintactico.ts`)
**Files:** `src/validador/sintactico.ts`, `tests/validador/sintactico.spec.ts`
**Test que falla (TDD) — un caso por construcción gramatical:**
```ts
test('parsea bloque Algoritmo/FinAlgoritmo', () => {
  const ast = parsear('Algoritmo A\nFinAlgoritmo')
  expect(ast.tipo).toBe('Programa')
})
test('parsea Si/SiNo/FinSi', () => {
  expect(parsear('Si x>0 Entonces Hi FinSi').errores.length).toBe(0)
})
test('parsea Segun/Hacer/FinSegun con DeOtroModo', () => { /* ... */ })
test('parsea Mientras/Hacer/FinMientras', () => { /* ... */ })
test('parsea Repetir ... Mientras (do-while, sin FinRepetir)', () => { /* ... */ })
test('parsea Para i=1 Mientras i<10 Cambio i+1 Hacer ... FinPara', () => { /* ... */ })
test('parsea Funcion f(Definir x Como Entero) -> Entero ... FinFuncion', () => { /* ... */ })
test('falta FinAlgoritmo -> S-002', () => {
  expect(parsear('Algoritmo A').errores[0].code).toBe('S-002')
})
```
**Implementación mínima:** parser descendente con pila de bloques abiertos y
emisor de errores `S-001..S-021` con línea/columna. Producción en 3 subtasks
si es necesario (T-12a bloques, T-12b expresiones/con precedencia, T-12c
funciones/para).
**Ver:** `npx vitest run tests/validador/sintactico.spec.ts` → PASS.
**Commit:** `git commit -m "feat(validador): parser a AST + errores S-xx (T-12)"`

### T-13 · Type checker semántico (`semantico.ts`)
**Files:** `src/validador/semantico.ts`, `tests/validador/semantico.spec.ts`
**Test que falla (TDD) — uno por cada código M-xxx relevante:**
```ts
test('M-001 variable usada sin declarar', async () => {
  const { diagnosticos } = await validar('Algoritmo A\nEscribir x\nFinAlgoritmo')
  expect(diagnosticos.some(d => d.code === 'M-001')).toBe(true)
})
test('M-002 declaración duplicada', async () => { /* 2 Declarar igual */ })
test('M-003 uso antes de inicializar', async () => { /* ... */ })
test('M-005 tipo inválido en Declarar', async () => { /* Como Bolo */ })
test('M-009 parámetro tipo distinto en llamada', async () => { /* ... */ })
test('M-012 llamada a función no definida', async () => { /* ... */ })
test('M-015 recursión no declarada', async () => { /* resultado = f() dentro de f */ })
test('M-018 Para sin Cambio -> warning bucle infinito', async () => { /* severity warning */ })
test('M-007 tipo de retorno incoherente con resultado', async () => { /* ... */ })
```
**Implementación mínima:** pase que recorre el AST con tabla de símbolos por
alcance; emite `M-001..M-024` (los 18 obligatorios; los warnings M-017/M-018/
M-021 se detectan al final). Detección de no-asignación por trayectoria
(basta comprobar que toda rama de `Si`/`Segun` asigna a `resultado`).
**Ver:** `npx vitest run` todo verde.
**Commit:** `git commit -m "feat(validador): checker semántico estricto M-xx (T-13)"`

### T-14 · API pública `validar(texto)` (`index.ts`)
**Files:** `src/validador/index.ts`, `tests/validador/validador.spec.ts`
**Test que falla (TDD) — golden parametrizado leyendo `specs/grammar/cases/`:**
```ts
import { readdirSync, readFileSync } from 'node:fs'
const cases = readdirSync('specs/grammar/cases').filter(f => f.endsWith('.pse'))
for (const f of cases) {
  const src = readFileSync('specs/grammar/cases/'+f,'utf8')
  const exp = JSON.parse(readFileSync('specs/grammar/cases/'+f.replace('.pse','.expected.json'),'utf8'))
  test('golden '+f, async () => {
    const r = await validar(src)
    expect(r.correcto).toBe(exp.correcto)
    expect(r.diagnosticos.map(d=>d.code)).toEqual(exp.diagnosticos)
  })
}
```
**Implementación mínima:** `validar` orquesta léxico→sintáctico→semántico,
ordena los diagnósticos por (linea, columna, code) y calcula `correcto =
!errores.filter(severity==='error').length`.
**Ver:** `npx vitest run tests/validador/validador.spec.ts` → 19 passed.
**Commit:** `git commit -m "feat(validador): API validar() + golden (T-14)"`

### T-15 · Cobertura y umbral
**Objetivo:** `npx vitest run --coverage` con `v8` → ≥ 90% en `src/validador/`.
**Verificación:** el informe de cobertura lo confirma; si no se alcanza, se añaden
tests hasta llegar al 90%.
**Commit:** `git commit -m "test: cobertura >=90% en validador (T-15)"`
## Fase 2 · UI (Vue 3 + CodeMirror 6, TDD con @vue/test-utils)

Cada componente nace con su test que falla. El entorno de test es `happy-dom`.

### T-20 · Composable `useArchivos` + localStorage
**Files:** `src/ui/composables/useArchivos.ts`, `tests/ui/useArchivos.spec.ts`
**Test que falla (TDD):**
```ts
test('crear archivo nuevo y persistir', () => {
  const a = useArchivos({ storage });
  a.nuevo('hola');
  expect(a.lista.value.map(f=>f.nombre)).toContain('hola')
  expect(JSON.parse(storage.getItem('pseudo-valido/files'))[0].nombre).toBe('hola')
  a.activar('hola'); expect(a.activo.value.nombre).toBe('hola')
})
test('renombrar y borrar', () => { const a = useArchivos({storage}); a.nuevo('x'); a.renombrar('x','y'); expect(() => a.borrar('x')).toThrow() })
test('restaurar desde localStorage tras recarga', () => { /* recargar() re-hidrata lista y activo */ })
test('sin localStorage -> modo memoria con aviso', () => { /* storage undefined */ })
```
**Implementación mínima:** ref reactive `lista`, `activo`, metodos `nuevo`,
`renombrar`, `borrar`, `seleccionar`, `recargar`; persiste tras cada cambio.
**Ver:** `npx vitest run tests/ui/useArchivos.spec.ts` -> PASS.
**Commit:** `git commit -m "feat(ui): useArchivos + persistencia (T-20)"`

### T-21 · Composable `useValidacion` con debounce
**Files:** `src/ui/composables/useValidacion.ts`, `tests/ui/useValidacion.spec.ts`
```ts
test('debounce 300ms: 5 ediciones -> 1 llamada a validar', async () => { /* fake timers */ })
test('exponer diagnosticos y estado ok', () => { /* correcto / n errores */ })
```
**Implementación mínima:** envuelve `validar`, debounce configurable, expone
`diagnosticos`, `correcto`, `validarAhora`.
**Commit:** `git commit -m "feat(ui): useValidacion con debounce (T-21)"`
### T-22 · `ListaArchivos.vue`
**Files:** `src/ui/componentes/ListaArchivos.vue`, `tests/ui/ListaArchivos.spec.ts`
```ts
test('muestra la lista y emite seleccionar', async () => {
  const c = mount(ListaArchivos, { props:{ archivos, activo } })
  expect(c.text()).toContain('hola')
  await c.get('[data-archivo-name="x"]').trigger('click')
  expect(c.emitted('seleccionar')[0]).toEqual(['x'])
})
```
**Comporta:** botones Nuevo / Renombrar / Borrar; resaltado del activo.
**Commit:** `git commit -m "feat(ui): ListaArchivos (T-22)"`

### T-23 · `EditorCodigo.vue` con CodeMirror 6
**Files:** `src/ui/componentes/EditorCodigo.vue`, `tests/ui/EditorCodigo.spec.ts`
```ts
test('carga contenido y emite input en vivo', async () => {
  const c = mount(EditorCodigo, { props:{ modelo:{value:'x'} } })
  // simular entrada de CodeMirror y comprobar emisión 'input'
})
test('aplica decoraciones de error a linea/columna', () => { /* diagnosticsView */ })
```
**Implementación mínima:** instanciar CodeMirror 6 (`EditorView`, `keymap`,
`LineNumber`, `Decoration` desde `diagnosticos`), sincroniza `modelo`. Para el
test, se puede usar un stub de CodeMirror si no es determinista bajo happy-dom
(documentarlo y excluir del coverage por integración).
**Commit:** `git commit -m "feat(ui): EditorCodigo con CodeMirror 6 (T-23)"`

### T-24 · `PanelDiagnosticos.vue` + `BarraEstado.vue`
**Files:** `src/ui/componentes/PanelDiagnosticos.vue`, `BarraEstado.vue`
```ts
test('lista diagnosticos con linea/columna/codigo', () => { /* monta y verifica */ })
test('barra estado ok vs errores/avisos', () => { /* correcto=true -> 'OK' */ })
```
**Commit:** `git commit -m "feat(ui): panel de diagnosticos y barra de estado (T-24)"`

### T-25 · Ensamblar `App.vue` (panel izq + editor der)
**Files:** `src/ui/App.vue` (o `src/App.vue`), `tests/ui/App.spec.ts`
```ts
test('muestra lista izquierda y editor derecha', () => {
  const c = mount(App)
  expect(c.findComponent(ListaArchivos).exists()).toBe(true)
  expect(c.findComponent(EditorCodigo).exists()).toBe(true)
})
test('escribir en el editor recalcula diagnosticos (debounce)', async () => { /* fake timers */ })
```
**Layout:** CSS grid `grid-template-columns: 280px 1fr`; panel izq =
`ListaArchivos` + acciones; derecha = `BarraEstado` + `EditorCodigo` +
`PanelDiagnosticos`. Persiste y restaura vía `useArchivos`.
**Commit:** `git commit -m "feat(ui): app de dos paneles ensamblada (T-25)"`

## Fase 3 · Integración y verificación
### T-30 · Build y lint
**Objetivo:** `npm run build` (vue-tsc + vite build) sin errores; `npm run lint` limpio.
**Verificación:** `npm run build` -> `dist/` generado; `vue-tsc --noEmit` exit 0.
**Commit:** `git commit -m "chore: build + lint verdes (T-30)"`

### T-31 · Prueba de aceptación end-to-end
**Objetivo:** en `npm run dev`, abrir un caso golden erróneo, ver diagnosticos en
línea/columna, cambiar el archivo y confirmar que persiste al recargar. Se
documenta en `docs/aceptacion.md` con capturas o pasos reproducibles.
**Commit:** `git commit -m "docs: prueba de aceptación E2E (T-31)"`

### T-32 · Revisión final (requesting-code-review)
**Objetivos:** seguridad (sin `eval`/`Function`, input escapado), calidad, y
cumplimiento global de `G-01` y `F-01`.
**Gates:** (1) cumplimiento de spec, (2) calidad de código, (3) `npm run test`
verde, (4) `npm run build` verde. Solo con los 4 en verde se da por cerrado.
**Commit:** `git commit -m "chore: revisión final y cierre (T-32)"`

## Fase 4 · Presentación y modo oscuro (R-12 / R-13 / R-14)

Objetivo: adoptar un framework CSS moderno, soportar el modo oscuro y mejorar
la tipografía y el editor (la app quedaba con colores hardcodeados, sin
modo oscuro y con un `<textarea>` sin números de línea).

### T-40 · Framework CSS: Pico v2 (R-12)
**Files:** `index.html`, `src/main.ts`, `package.json`
- `pnpm add @picocss/pico` (v2, con `--config.production=false` para no saltarse devDeps con pnpm).
- Se importa `@picocss/pico/css/pico.min.css` en `main.ts` (empaqueta el
  bundler; sin CDN en producción).
**Verificación:** `npm run build` genera `dist/` con el CSS de Pico integrado.
**Commit:** `chore: Pico CSS como framework de base (T-40)`

### T-41 · Modo oscuro con `useTema` (R-13) — TDD
**Files:** `src/ui/composables/useTema.ts`, `tests/ui/useTema.spec.ts`
- `useTema()`: modo `auto|claro|oscuro`, escribe/elimina `data-theme` en el
  `<html>`, `auto` sigue `prefers-color-scheme`, persiste en
  `localStorage['pseudo-valido/theme']`, y expone `alternar()`.
- `src/estilo/tema.css`: capa de tokens `--pv-*` que deriva de los tokens de
  Pico (`--pico-background-color`, `--pico-color`, …) para superficies
  clara/oscura coherentes.
**Verificación:** `npx vitest run tests/ui/useTema.spec.ts` → PASS.
**Commit:** `feat(ui): tema auto/claro/oscuro con useTema (T-41)`

### T-42 · Editor con gutter + tipografía Pico (R-14)
**Files:** `src/ui/componentes/EditorCodesmio.vue`, los demás componentes
- El editor gana un **gutter de números de línea** (sincronizado con el
  scroll), tipografía monoespaciada de Pico y foco visible; conserva el
  contrato `<textarea>` + `.editor-codigo` + emit `actualizar`.
- Todos los componentes usan `var(--pv-*)` en vez de colores hardcodeados.
**Verificación:** `npm run test` verde y `npm run build` verde.
**Commit:** `feat(ui): editor con gutter y tipografía Pico (T-42)`

## Resumen de flujo TDD
`rojo -> verde -> refactor`, una tarea a la vez, revision en dos fases entre
tareas, commit tras cada tarea y suite completa verde antes de avanzar.
