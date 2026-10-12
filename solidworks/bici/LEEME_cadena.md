# Cadena 08B — cómo hacerla (SolidWorks 2020)

Método: **una sola pieza "semilla"** (eslabón interior + exterior, 25,4 mm) y la
**Matriz de componentes de cadena** del ensamblaje. Nada de 54 eslabones con sus
relaciones de posición.

## 1. Crear la semilla (macro)

1. SolidWorks → *Herramientas → Macro → Editar…* (se abre Macro1.swp).
2. En el editor VBA: *Archivo → Importar archivo…* → `cadena_eslabon_v1.bas`.
3. Pulsa **F5** y ejecuta `main`.
4. Al terminar sale un aviso. Revisa: *Sólidos = 1*, vista isométrica, y las
   ecuaciones en *Herramientas → Ecuaciones*.
5. Guarda como `Cadena_semilla.SLDPRT`.

Si sale un error, pega aquí el texto y la línea que marca (*Depurar → Ctrl+L*).
Cada versión nueva de la macro llevará un nombre nuevo (`_v2`, `_v3`…).

## 2. Medidas

Catálogo 08B (ISO 606, según listados de fabricantes; confirmar con tu cadena):
paso 12,7 · ancho interior 7,75 · rodillo Ø8,51 · eje Ø4,45.

**Supuestos míos** (cámbialos en *Ecuaciones* si no son los de tu cadena):
espesor de placa 1,6 · alto de placa 11,8 · radio de extremo 5,8 · holgura
placa interior/exterior 0,2 · longitud de eje 16,7.

## 3. Montar la cadena (a mano, en el ensamblaje)

1. Inserta `Cadena_semilla` en el ensamblaje de la bici.
2. Croquis de la trayectoria: arcos sobre los **círculos primitivos** del plato y
   del piñón, unidos por rectas tangentes (lazo cerrado). Radio primitivo =
   `paso / (2·sen(180°/dientes))`.
3. *Ensamblaje → Matriz lineal de componentes → Matriz de componentes de cadena*:
   trayectoria = ese croquis, componente = la semilla, **distancia = 25,4 mm**.
4. Número de semillas = (longitud de la cadena en pasos) / 2, redondeado de modo
   que la cadena tenga un número **par** de eslabones.
   Longitud en pasos: `L = 2·C/p + (Z1+Z2)/2 + p·((Z2−Z1)/(2π))² / C`
   (C = distancia entre ejes, p = 12,7, Z1/Z2 = dientes de plato y piñón).

Datos que faltan: dientes del plato y del piñón, y distancia entre ejes.
