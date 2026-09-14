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

### buscar-bc3-placsp.py
Busca archivos BC3 en licitaciones de **obras** publicadas por la
Administración Pública española en la Plataforma de Contratación del
Sector Público (PLACSP), a partir de su feed Atom de sindicación de
licitaciones. Descarga lo que encuentra en `data/bc3-placsp/` (no
versionado) junto con un `resumen.csv` de lo revisado. Pensado para
localizar bancos de precios/mediciones reales con los que ampliar
`data/base-precios.json`, no para un contrato concreto.

**No se ha podido probar contra el sitio real** (PLACSP no era accesible
desde el entorno donde se escribió el script) — la estructura exacta de
sus páginas puede no coincidir con lo que asume el script. Ejecútalo con
`--verbose` la primera vez; si no encuentra nada, revisa
`data/bc3-placsp/_debug/` (páginas guardadas tal cual) para ver qué está
pasando.

```bash
python scripts/buscar-bc3-placsp.py --verbose
python scripts/buscar-bc3-placsp.py --dias 15 --max-expedientes 50
```

## Después de regenerar `data/base-precios.json`

1. Actualiza `CACHE_VERSION` en `js/precios-loader.js`.
2. Sube en uno el parámetro `?v=` del import de `precios-loader.js` en
   `js/main.js` (cache-busting del módulo).
3. Si ha cambiado el número total de partidas, revisa los textos que lo
   mencionan (`pages/gestor-presupuestos.html`, `pages/calculadora-ia.html`,
   `CLAUDE.md`).
