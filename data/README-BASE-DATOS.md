# Base de Datos de Precios - ObraTudela

## Descripción

Base de datos de precios de construcción BCEXTREM 2026 (Extremadura),
formato FIEBDC-3/BC3. Es la **única fuente de verdad** del proyecto — ver
"Herramientas de presupuestos" en `CLAUDE.md` para cómo se usa desde
`pages/gestor-presupuestos.html` y `pages/calculadora-ia.html`.

## Especificaciones

- **Total partidas**: 61.447
- **Formato**: JSON (array plano) + versiones comprimidas `.gz` / `.br`
- **Códigos**: BC3 estándar (compatibles con Presto, Arquímedes, TCQ, etc.)

## Estructura de Archivos

```
base-precios.json              # Base de datos principal (~28 MB)
base-precios.json.gz           # Comprimido GZ
base-precios.json.br           # Comprimido Brotli (usado por la calculadora)
precios-con-desgloses.json     # Desglose de recursos por partida (NO en git, ver .gitignore)
BCEXTREM26.bc3                 # Banco de precios original FIEBDC-3 (NO en git, ~18 MB)
```

## Estructura de una partida

```json
{
  "cod": "01AAB00001",
  "uni": "m2",
  "res": "DEMOLICIÓN DE BÓVEDA A LA CATALANA, INCLUSO CARGA MANUAL",
  "precio": 15.89,
  "desc": "Descripción técnica completa de la partida",
  "grupo": "DEMOLICION",
  "capitulo": "ACTUACIONES PREVIAS, CONSOLIDACIONES Y DEMOLICIONES",
  "subcapitulo": "ALBAÑILERÍA > Arcos y bóvedas de ladrillo > Bóvedas"
}
```

- `grupo`: una de las 17 categorías/oficios curadas a mano para organizar
  `pages/gestor-presupuestos.html` (ver `scripts/reclasificar-oficios.py`).
- `capitulo`/`subcapitulo`: jerarquía real del banco de precios BC3 (24
  capítulos), presente solo en las partidas cuyo código existe en
  `BCEXTREM26.bc3` (~54.600 de 61.447; el resto son partidas heredadas de
  versiones anteriores del banco de precios).

## Actualización

Ver `scripts/README.md` para el flujo completo. En resumen:

1. Editar `data/base-precios.json` a mano, o volver a ejecutar
   `python scripts/enriquecer-base-precios.py` si hay un `.bc3` nuevo.
2. `python scripts/unificar-bases-precios.py` para regenerar el gestor.
3. Actualizar `CACHE_VERSION` en `js/precios-loader.js` y el `?v=` del
   import de `precios-loader.js` en `js/main.js`.

## Notas

- La calculadora carga automáticamente la versión comprimida (`.br`) para
  mayor velocidad.
- El `.bc3` original no se versiona en git (`*.bc3` en `.gitignore`) por su
  tamaño; hay que colocarlo manualmente en `data/BCEXTREM26.bc3` antes de
  ejecutar `enriquecer-base-precios.py`.
