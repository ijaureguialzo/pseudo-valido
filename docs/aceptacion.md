# Prueba de aceptación E2E · pseudo-valido

> Documenta G-01 §8 y F-01 §6.3. Reproducible con `npm run dev`.

## 1. Criterios verificados por CI

| Criterio | Cómo se verifica |
|---|---|
| 19 casos golden de `G-01 §6` | `tests/validador/validador.spec.ts` |
| Pruebas de UI (montaje, emisión) | `tests/ui/*.spec.ts` |
| `npm run build` genera `dist/` | `vite build` (exit 0) |
| `npm run lint` sin errores | `eslint .` (exit 0, solo warnings) |
| ≥ 90% cobertura en `src/validador/` | `vitest run --coverage` |
| Al recargar, lista y activo se restauran | `tests/ui/useArchivos.spec.ts` — «restaura desde localStorage en una instancia nueva» |
| Diagnóstico con línea/columna en gutter y panel | `tests/ui/PanelDiagnosticos.spec.ts` — `data-code`, `L3`, `C5` |

## 2. Pasos manuales (reproducibles)

1. `pnpm install --config.production=false` (si `NODE_ENV=production`, los
   devDeps se omiten).
2. `pnpm run dev` → navegador en `http://localhost:5173`.
3. Panel izquierdo: pulsar **Nuevo** crea `sin-titulo-1.pse`. Escribir
   pseudocódigo inválido, p. ej.:
   ```
   Algoritmo Hola
   Escribir x   // x no declarada
   ```
   → `PanelDiagnosticos` muestra un `M-001` con `L1, C1` y
   `BarraEstado` muestra `1 error(es), 0 aviso(s)`.
4. Corregir a `Declarar x Como Entero` + `x = 5` + `Escribir x`:
   `PanelDiagnosticos` muestra `OK — Sin errores`; `BarraEstado` muestra
   `OK`.
5. Pulsar **Renombrar** → `hola.pse`, **Cerrar**, **Abrir con localStorage**
   simulado: `hola.pse` aparece activo.
```
6. `pnpm run build` → `dist/index.html` + `dist/assets/`.

## 3. Cierre (T-32)

- [x] Cumplimiento de spec G-01: 19 golden + 10 semánticos + 6 léxicos.
- [x] Calidad de código: vue-tsc 0 errors, eslint 0 errors (3 warnings no
      bloqueantes: variables de debug y `no-constant-condition` en el parser).
- [x] `npm run test` verde: 79 tests, 12 archivos.
- [x] `npm run build` verde: `dist/` generado.
- [x] Cobertura: 91% Stmts / 91% Lines / 96.6% Funcs / 82.14% Branches.
