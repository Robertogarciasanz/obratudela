# Traspaso de sesión — Caja 23 en SolidWorks

> Pega este archivo al empezar la conversación nueva (app de escritorio de Claude,
> con uso del ordenador activado) para seguir donde se quedó, sin empezar de cero.

## Qué quiero hacer

Modelar en **SolidWorks 2020 (en español)** la **caja 23** (plano `caja23.PDF`,
caja de 120 × 80 × 40 mm) con una **macro VBA para copiar y pegar**, y que encaje
con la **tapa v1** que ya funciona. Quiero que **tomes el control del ordenador**,
ejecutes la macro en SolidWorks y corrijas los errores hasta que salga bien.

## Dónde están los archivos

- En GitHub: repositorio `robertogarciasanz/obratudela`, rama
  `claude/pensive-rubin-8eicj8` (PR #13), carpeta **`modelo3d/`**.
- También los tengo descargados en mi ordenador (pregúntame la carpeta).

| Archivo | Qué es |
|---|---|
| `modelo3d/caja23_v4_pegar.bas` | **Macro actual de la caja, la que hay que probar.** |
| `modelo3d/herramientas/ejemplos/pieza_tapa_v1.bas` | Tapa v1: **funciona en SolidWorks**. Es la referencia. |
| `modelo3d/caja23_isometrico.pdf` | Plano isométrico A3 de la caja. |
| `modelo3d/caja23.step` | Modelo 3D de comprobación (hecho con CadQuery, sin historial). |
| `modelo3d/herramientas/` | Revisor y generador de macros, biblioteca VBA, plantilla (ver su README). |
| `solidworks-macro-modelado.zip` | Skill actualizada con todo lo aprendido (súbela a la cuenta si no está). |

## Estado ahora mismo

- La **v4** sale **sin errores en el revisor**, pero **todavía no se ha probado en SolidWorks**.
- La v3 fallaba al compilar por una variable llamada `xOr` (choca con el operador
  `Xor` de VBA). En la v4 se llama `xTal`.
- Partes **nuevas, sin probar nunca en SolidWorks**: la función `CutAx` (cortes con
  desfase en cualquier eje; la usa la caja para casi todos los cortes) y
  `CaraPlana` / `Vaciado` (no las usa la caja).
- Lo que ya funcionó hace dos días con la tapa: `Boss`, `CutThru`, `CutAvell`,
  `FilletEdges`, `FilletFace`, croquis acotados y ecuaciones.

## Qué hacer primero

1. Abrir SolidWorks. **Herramientas > Macro > Nueva**, guardar como `caja23.swp`.
2. En el editor VBA: borrar todo, pegar `caja23_v4_pegar.bas` completo y pulsar **F5**.
3. Si sale error de compilación: mirar la línea en amarillo, corregir y repetir.
   Si es un error en tiempo de ejecución: **Depurar > Ctrl+L** (pila de llamadas)
   para ver qué línea de `main` falla, y **Ejecutar > Restablecer** antes de reintentar.
4. Al terminar, revisar el aviso final (puede quedar detrás del editor), que
   **"Sólidos" = 1** y comparar con `caja23_isometrico.pdf`.
5. Si `CutAx` falla, probar cambiando solo el parámetro de dirección (es lo que
   pasaba con `CutOff` antes de que funcionara).

## Medidas de la caja (y cuáles son supuestas)

- Exterior 120 × 80 × 40, pared y fondo **3 mm**, cara abierta la de 120 × 80.
- Esquinas: R10 exterior, R7 interior, rebaje de la tapa 1,5 × 2 (R8,5).
- 4 orejetas exteriores de 7 × 4 en X = ±46, R1.
- **Taladros Ø2,5 (M3 autorroscante), profundidad 12, en X = ±46,77 e Y = ±40,045**
  (`L/2 − 13,23` y `80,09/2`): **los mismos ejes que la tapa v1**, para que coincidan.
- Compartimento de 75 × 25 a 32 del borde izquierdo, tabiques de 1,5 × 30 de alto,
  y una ventana de 70 × 20 en el fondo con marco de 2,5.
- Alojamiento de 35 × 35 a 40 del borde derecho, con suelo a 12, cuna R16 de 4 de
  profundidad y 2 soportes Ø6 con taladro Ø2,5.
- 2 ventanas de 11 × 13 (R2) en el lateral derecho y 1 en el izquierdo, a 24 del borde abierto.
- **Supuestas (no vienen en el plano):** fondo de 3, tabiques de 30 de alto, cuna R16,
  rebaje de 1,5 × 2, ventana izquierda centrada y orejetas a ±46 de 7 de ancho (en el plano
  parecen de 8 en ±47, pero chocarían con el R10). Todas están en **Herramientas > Ecuaciones**.

## Reglas que ya sabemos (no repetir errores)

- Formato: **un solo texto para pegar, igual que la tapa v1**: cabecera →
  `Option Explicit` y variables → constantes → `Sub main` → `Globals` → funciones.
- Salientes primero, cortes después y redondeos siempre al final; un único sólido.
- No seleccionar por coordenadas ni por nombre ("Esbozo1" no existe: en español es "Croquis1").
- `NewDocument` con la plantilla por defecto, no con `""`.
- No usar palabras reservadas de VBA como nombres de variable (`Xor`, `Or`, `Mod`...).
- Antes de dármela, pasar la macro por `herramientas/revisar_macro.py`.
- Cada versión nueva, con **nombre nuevo** (v5, v6...).
- Explicarme todo en español sencillo: no soy programador.
