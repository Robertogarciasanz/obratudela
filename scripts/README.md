# 🐍 Scripts Python - ObraTudela

## Uso de los scripts

Ejecuta siempre desde la raíz del proyecto (donde está `index.html`):

```bash
python scripts/nombre-del-script.py
```

## Base de precios (fuente de verdad: `data/base-precios.json`)

Ver la sección "Herramientas de presupuestos" en `CLAUDE.md` para la
arquitectura completa. Resumen de los scripts activos:

### parsear_bc3.py
Parser genérico del formato FIEBDC-3/BC3 (CYPE, Presto...). No se ejecuta
directamente, lo importan los dos scripts siguientes.

### enriquecer-base-precios.py ⭐
Lee `data/BCEXTREM26.bc3` (banco de precios original, NO versionado — hay
que colocarlo ahí antes de ejecutar) y `data/base-precios.json`, y añade:
- `capitulo`/`subcapitulo`: jerarquía real de capítulos del banco de precios.
- `desc`: rellena descripciones que faltaran, usando el texto del BC3.
- `data/precios-con-desgloses.json` (NO versionado): desglose de recursos
  (mano de obra, maquinaria, materiales) de las partidas compuestas.

```bash
python scripts/enriquecer-base-precios.py
```

### unificar-bases-precios.py ⭐
Regenera el bloque de datos incrustado en `pages/gestor-presupuestos.html`
a partir de `data/base-precios.json` (agrupando por el campo `grupo`).
Ejecútalo siempre que edites `data/base-precios.json` a mano y quieras que
el gestor refleje el cambio — **no edites el `DATA_B64` del gestor a mano**.

```bash
python scripts/unificar-bases-precios.py
```

### generar-paginas-partidas-seo.py
Genera páginas HTML estáticas en `/partidas/` (una por categoría: demolición,
imbornales, sumideros, arquetas...) con el listado completo de precios de esa
categoría en el propio HTML (no vía JS), para que buscadores e IAs puedan
leer los precios sin ejecutar nada. Añade categorías nuevas a la lista
`PARTIDAS_POPULARES` del script. Si generas páginas nuevas, añádelas también
a `sitemap.xml` y, si quieres que sean navegables, enlázalas desde
`pages/base-precios-listado.html`.

```bash
python scripts/generar-paginas-partidas-seo.py
```

### compress-precios.js / compress-precios.cjs
Generan las versiones comprimidas `.gz`/`.br` de `data/base-precios.json`
(también las regeneran `enriquecer-base-precios.py` y
`unificar-bases-precios.py` al tocar el JSON).

## Después de regenerar `data/base-precios.json`

1. Actualiza `CACHE_VERSION` en `js/precios-loader.js`.
2. Sube en uno el parámetro `?v=` del import de `precios-loader.js` en
   `js/main.js` (cache-busting del módulo).
3. Si ha cambiado el número total de partidas, revisa los textos que lo
   mencionan (`pages/gestor-presupuestos.html`, `pages/calculadora-ia.html`,
   `CLAUDE.md`).
