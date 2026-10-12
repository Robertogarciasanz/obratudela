# Caja (SolidWorks 2020) — estado del trabajo

Archivo de traspaso entre sesiones de Claude (nube ↔ ordenador). **Léelo al
empezar y actualízalo al terminar**, para que Roberto no tenga que repetir nada.

Última actualización: 2026-10-12 (sesión en la nube).

## Encargo (palabras de Roberto)

Roberto García Sanz trabaja con **SolidWorks 2020 en Windows**. Quiere:

1. Leer el plano y obtener una tabla con todas las cotas, la forma, el material
   y el espesor. Marcar las cotas ilegibles o que falten. **No inventar ninguna:
   preguntar.**
2. Cuando confirme las cotas, escribir **macros VBA** que modelen la pieza:
   croquis totalmente acotados, cotas como variables globales, operaciones en
   orden lógico y redondeos al final.
3. Opcional: código de los planos A4 con vistas y cotas.

Claude no puede ejecutar SolidWorks desde la nube: Roberto lanza la macro y
pasa los errores. Todo en español.

## Plano

- Google Drive de Roberto: **`plano_caja_v4.pdf`**, id `1Y9vCCPNFvb6XircVrzy-NxZd8Bcs8rRi`
  (carpeta raíz de Drive). «CAJA — Plano de conjunto, cotas detalladas»,
  04/10/2026, primer diedro (ISO E), escala 1:1, cotas en mm.
- Vistas: alzado (cara abierta), alzado detalle interior, perfil derecho,
  perfil izquierdo, corte B-B (x = 57,3), planta, isométrica.
- Nota del propio plano: *geometría medida sobre `caja.STL`; tolerancias no
  indicadas; radios y diámetros tomados de la malla.*
- **Limitación:** desde la nube solo se pudo extraer el texto del PDF (los
  números salen sin su posición). Para acotar bien hay que **ver el dibujo**
  (PDF o capturas).

## Cotas leídas con seguridad

| Dato | Valor |
|---|---|
| Largo total (X) | 120 mm |
| Esquinas exteriores | R4 |
| Paredes lateral, superior e inferior | 4 mm |
| Pared posterior | 5 mm |
| Cavidad interior | 112 × 72 × 35 (prof.) |
| Bosses centrales | 10 × 7,75 (inferior) y 10 × 7,25 (superior), hasta y=29 |
| Repisas del canal | en y=21 |
| Canal semicircular | R15,6 × 40, eje paralelo a X, prof. 15,5 |
| Taladros | 7 × Ø2,7 con avellanado Ø3,6 |
| Agujeros pequeños | Ø1,5 (Ø2,9 boca), aparecen dos |
| Marco | 79,25 × 25 |
| Hueco | 70 × 20, prof. 30 (y=5 a y=35) |
| Ventanas | 2 pasantes en pared de 4 mm |
| Corte B-B | x = 57,3; alturas desde la cara posterior |

## Pendiente de confirmar con Roberto (NO suponer)

1. **Material:** no aparece en el plano.
2. **Espesor:** no es chapa; paredes 4 y 5 mm. ¿Correcto?
3. **Alto y ancho exteriores:** solo sale el largo 120. Por la cavidad
   (112 × 72 + 2·4) saldría 120 × 80, pero no está acotado. ¿Profundidad
   exterior = 35 + 5 = 40?
4. **Series de números sueltos** sin asignar a una cota: `9,09 · 8 · 85,82`,
   `55 · 10 · 55`, `13,23 · 93,54 · 13,23`, `6,25 · 5,25 · 70 · 4 · 34,5`,
   `57,76`, `3,11 · 12,27`, `40 / 40 / 40`, `39,93 · 3 · 4,22 · 3,1`.
5. **Posiciones** de los 7 taladros Ø2,7, de los 2 agujeros Ø1,5 y de las 2
   ventanas pasantes (tamaño incluido; aparece un «11» suelto).
6. **Origen y ejes:** el plano usa «y=21 / 29 / 35», pero no queda claro dónde
   está el (0,0,0) ni si Y es la profundidad.
7. **Tolerancias:** ninguna; al ser medidas de malla, algunas pueden estar
   redondeadas.

## Siguientes pasos

1. Ver el plano (PDF o capturas) y rellenar la tabla completa con Roberto.
2. Roberto confirma cotas → escribir `solidworks/caja/caja.bas` (VBA, SW 2020):
   variables globales con las cotas, croquis totalmente acotados, operaciones
   en orden lógico, redondeos al final.
3. Explicar cómo lanzarla: *Herramientas → Macro → Nueva/Editar*, ejecutar `main`.
4. Roberto pega los errores → corregir.
5. Opcional: macro de planos A4 (vistas y cotas).

## Registro de errores / avances

_(vacío — anotar aquí qué macros se han ejecutado y el texto exacto de cada error)_
