# Herramientas para macros de SolidWorks

Herramientas para crear piezas de SolidWorks con macros VBA, revisarlas antes
de abrir SolidWorks y sacar planos isométricos en PDF. Están pensadas para
SolidWorks 2020 en español.

| Archivo | Para qué sirve |
|---|---|
| `revisar_macro.py` | Revisa una macro y avisa de los errores típicos antes de llevarla a SolidWorks. |
| `generar_macro.py` | Une tu pieza con la biblioteca y crea la macro lista para pegar (y la revisa). |
| `plantilla_pieza.bas` | Punto de partida para una pieza nueva. |
| `SwBiblioteca.bas` / `SwBiblioteca_declaraciones.bas` | Funciones comunes: croquis acotados, salientes, cortes, redondeos, variables globales. |
| `vista_previa/hlr.py` | Proyecta un sólido en isométrica quitando las líneas ocultas. |
| `vista_previa/plano.py` | Monta el plano A3 en PDF: marco, vistas, cotas, notas y cajetín. |
| `ejemplos/` | Tapa v1 (**probada en SolidWorks**: la referencia), caja 23 completa (pieza, modelo 3D y plano) y dos macros con errores para probar el revisor. |

## 1. Revisar una macro

```
python revisar_macro.py mi_macro.bas
```

No hace falta instalar nada: basta con Python 3. Detecta, entre otros:

- un `Sub` dentro de otro, código fuera de un `Sub`, bloques `If`/`For`/`Do`/`With` sin cerrar;
- `Is Only`, `Is Null` y otras formas mal escritas de `Is Nothing`;
- número de argumentos incorrecto en los métodos de la API más usados
  (`FeatureExtrusion2/3`, `FeatureCut4`, `HoleWizard5`, `SelectByID2`, ...);
- métodos que no existen (`PartDoc.InsertShell`) y el sustituto correcto;
- `NewDocument("")` sin plantilla, nombres que dependen del idioma (`"Esbozo1"`
  en vez de `"Croquis1"`), selección de caras por coordenadas;
- `HoleWizard5` sin cara seleccionada o con números en vez de constantes;
- `InsertFeatureShell` sin la marca 1 en la cara a quitar.

Ejemplo con las dos macros de `ejemplos/`:

```
python revisar_macro.py ejemplos/macro_macho_usuario.bas
== ejemplos/macro_macho_usuario.bas: 6 errores, 2 avisos
  ERROR linea    7: "Sub main" empieza dentro de "Sub main" (linea 1). ...
  ERROR linea   11: "Is Only": para comprobar si un objeto existe se escribe "Is Nothing".
  ERROR linea   19: HoleWizard5 lleva 27 argumentos y aqui hay 20. ...
```

Se ha probado con las 439 macros de la biblioteca abierta CodeStack: solo
marca 3, y son fragmentos sueltos, no macros completas.

## 2. Crear una pieza nueva

1. Copia `plantilla_pieza.bas` como `pieza_<nombre>.bas` y rellena las
   constantes (arriba) y las operaciones de `Sub main` (abajo).
2. Genera la macro:
   ```
   python generar_macro.py pieza_<nombre>.bas
   ```
   Crea `<nombre>_pegar.bas` y la revisa. Si sale "sin errores", ya se puede llevar a SolidWorks.
   La macro sale con el mismo orden que la tapa v1, que funciona: cabecera ->
   `Option Explicit` y variables -> constantes -> `Sub main` -> `Globals` -> funciones.
3. En SolidWorks: **Herramientas > Macro > Nueva**. En el editor, borra todo,
   pega el contenido de `<nombre>_pegar.bas` y pulsa **F5**.
4. Revisa el aviso final, que "Sólidos" sea 1 y que las cotas estén en
   **Herramientas > Ecuaciones**.

Reglas que siguen la biblioteca y la plantilla (vienen de lo que ha funcionado en SolidWorks):

- Ejes: X largo, Y alto, Z profundidad; Z=0 cara de apoyo; pieza centrada en X e Y.
- Salientes primero, cortes después y redondeos siempre al final.
- Croquis con rectángulos y círculos acotados al origen, sin redondeos de croquis.
- Nada de seleccionar por coordenadas ni por nombre: se guardan los objetos que devuelve la API.
- Todas las medidas como variables globales enlazadas a las cotas.

## 3. Vista previa y plano en PDF (sin SolidWorks)

Para comprobar la geometría y sacar el plano se reproduce la pieza en
CadQuery (programa de CAD libre para Python):

```
python -m venv venv && venv/bin/pip install cadquery reportlab
venv/bin/python ejemplos/modelo_caja23.py     # comprueba 1 sólido y exporta caja23.step
venv/bin/python ejemplos/plano_caja23.py caja23_isometrico.pdf
```

`plano.py` se reutiliza para cualquier pieza: `Hoja` → `marco()` → `vista()`
→ `cota()` / `nota()` → `cajetin()` → `guardar()`. Ver `ejemplos/plano_caja23.py`.

## Qué está probado y qué no

- **Probado en SolidWorks 2020:** la tapa v1 (`ejemplos/pieza_tapa_v1.bas`) y su biblioteca
  (croquis, `Boss`, `CutThru`, `CutAvell`, `FilletEdges`, `FilletFace`, ecuaciones), que es la de `SwBiblioteca.bas`.
- **Nuevo, sin probar todavía en SolidWorks:** `CutAx` (cortes con desfase en
  cualquier eje, usado en caja23) y `CaraPlana` / `Vaciado`. Están marcados como
  NUEVO en `SwBiblioteca.bas`. Si fallan, el aviso final de la macro lo dice.
- **Número de argumentos de la API:** `FeatureExtrusion3` y `FeatureCut4`
  salen de macros que ya han funcionado. `FeatureExtrusion2` (23) está
  contrastado con CodeStack. El orden de `HoleWizard5` (27) sale de la ayuda
  de la API de SolidWorks; la ayuda está bloqueada desde la nube, así que
  conviene confirmarlo la primera vez en SolidWorks.

Fuentes: ayuda de la API de SOLIDWORKS (help.solidworks.com),
[CodeStack](https://github.com/xarial/codestack) (macros de ejemplo de código abierto).
