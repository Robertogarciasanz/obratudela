# ObraTudela — contexto para Claude Code

## La empresa

Sitio web y herramientas internas de **Excavaciones y Servicios Arturo S.L.**
(obratudela.com), empresa de excavaciones, movimiento de tierras y obra civil
en Tudela de Duero (Valladolid). No es una empresa de software: este repo es
la web corporativa + un par de herramientas de gestión (presupuestos,
anuncios de maquinaria). Trátalo como tal — sin frameworks, sin build step,
priorizando que un no-programador (el dueño del negocio) pueda entender y
tocar los archivos si hace falta.

## Stack

- HTML/CSS/JS "vanilla", sin frameworks ni bundler. Cada página tiene su
  propio `css/<page>.css` y, si necesita interactividad, `js/<page>.js`.
- `admin-server.js`: servidor Node con `http` puro (sin Express), solo para
  uso **local** del dueño del negocio vía `iniciar-admin.bat` — gestiona
  `anuncios.json` y sube cambios a git. No es un backend de producción.
- Sin tests automatizados ni linter configurado. La verificación es manual:
  abrir el HTML en el navegador o levantar `node admin-server.js` y probar
  el flujo en `http://localhost:3000`.

## Convenciones de código

- Comentarios y textos de UI en **español**.
- 2 espacios de indentación, comillas simples, punto y coma.
- No introducir dependencias, frameworks ni pasos de build salvo que se pida
  explícitamente — el punto fuerte de este proyecto es que se despliega tal
  cual, sin compilar nada.

## Herramientas de presupuestos

Hay dos herramientas de presupuestos, pero **una sola fuente de verdad**:
**`data/base-precios.json`** (61.447 partidas, array plano). El HTML del
gestor se **genera a partir de ese JSON**, no se edita a mano:

- **`data/base-precios.json`** — fuente de verdad única. Cada partida lleva
  `cod`, `uni`, `res`, `precio`, `desc`, `grupo` (oficio, 17 categorías
  curadas a mano para el gestor) y, cuando el código existe en el banco de
  precios BC3 real (`data/BCEXTREM26.bc3`, no versionado, ver más abajo),
  también `capitulo`/`subcapitulo` (jerarquía real del banco de precios,
  24 capítulos). Versiones comprimidas `.json.gz`/`.json.br` junto al
  original. La usan `pages/calculadora-ia.html` (vía `js/precios-loader.js`
  + `js/search.js`) y `pages/base-precios-listado.html`.
- **`pages/gestor-presupuestos.html`** — herramienta principal, la que usan
  clientes reales. Lleva las mismas partidas **incrustadas dentro del propio
  HTML** como un bloque comprimido (zlib + base64, variable `DATA_B64`),
  organizadas en las 17 hojas/oficios del campo `grupo`, para que cargue
  rápido sin hacer `fetch`. Se regenera con
  `python scripts/unificar-bases-precios.py` — **no la edites a mano**: ese
  script lee `data/base-precios.json` y reescribe el `DATA_B64` del gestor
  agrupando por `grupo`.
- **`data/precios-con-desgloses.json`** (no versionado, ver `.gitignore`) —
  para las partidas compuestas (~24.200 de 61.447), el desglose real de
  recursos (mano de obra, maquinaria, materiales) que forman su precio:
  `{cod_partida: [{cod, res, uni, precio, cantidad, importe}, ...]}`.
  Generado, no consumido todavía por ninguna página — pensado para una
  futura vista de "ver desglose" en el gestor o la calculadora.

Scripts relevantes (en orden de uso si hay que regenerar todo desde cero):
`scripts/parsear_bc3.py` (parser genérico del formato FIEBDC-3/BC3, no se
ejecuta directo) → `scripts/enriquecer-base-precios.py` (lee
`data/BCEXTREM26.bc3` + `data/base-precios.json`, añade capítulo real y
desglose) → `scripts/unificar-bases-precios.py` (regenera el gestor desde
`data/base-precios.json`). El `.bc3` original (~18 MB, formato FIEBDC-3 de
CYPE/Presto) no está en git (`*.bc3` en `.gitignore`) — si hay que volver a
ejecutar `enriquecer-base-precios.py`, colócalo en `data/BCEXTREM26.bc3`
antes.

`data/base-precios.json` **no lo leas entero** con Read — usa `Grep`/`head`/
`jq` para consultar entradas concretas, o se desperdicia el contexto. Si lo
regeneras, actualiza también `CACHE_VERSION` en `js/precios-loader.js` y el
parámetro `?v=` de los imports en `js/main.js` (cache-busting), o quien ya
haya visitado la calculadora seguirá viendo la base antigua.

`anuncios.json` (compraventa de maquinaria, gestionado por `admin-server.js`)
no existe actualmente en el repo — `js/anuncios.js` hace `fetch('anuncios.json')`
y la página de anuncios no carga listados. Ya se intentó arreglar una vez
(commit "Corregir página de anuncios") y se revirtió; antes de tocarlo,
pregunta al dueño del negocio por qué se revirtió.

## Despliegue

`git push` a `main` → GitHub Actions (`.github/workflows/deploy.yml`) publica
automáticamente en GitHub Pages (`www.obratudela.com`) en menos de un
minuto. No hay entorno de staging: cualquier cambio en `main` es producción.
Ten cuidado especial con cambios en `pages/gestor-presupuestos.html` y
`pages/calculadora-ia.html` (calculadoras de presupuestos que usan clientes
reales) y en los datos de `anuncios.json` (anuncios activos de venta/alquiler
de maquinaria).

## Fallo recurrente: rutas relativas sin `../`

Varias páginas dentro de `pages/` han tenido bugs por usar rutas como
`fetch('fonts/x.woff2')` o `<img src="img/logo.jpg">` en vez de
`../fonts/...` / `../img/...` — la ruta se resuelve relativa a
`pages/`, no a la raíz del sitio, y el recurso no se encuentra (404
silencioso). Si algo no carga en una página dentro de `pages/`, es lo
primero a comprobar.
