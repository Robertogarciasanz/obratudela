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

Hay dos herramientas independientes, cada una con su propia copia de la base
de precios — no comparten datos en tiempo real, así que una actualización
hay que aplicarla a las dos por separado:

- **`pages/gestor-presupuestos.html`** — herramienta principal, la que usan
  clientes reales. Lleva la base de precios (BCEXTREM 2026, 61.447 partidas)
  **incrustada dentro del propio HTML** como un bloque comprimido
  (zlib + base64, variable `DATA_B64`). Para actualizarla hay que
  descomprimir ese bloque, modificarlo y volver a comprimirlo — ver
  `scripts/actualizar-gestor-2026.py`, `scripts/reclasificar-oficios.py` y
  `scripts/recuperar-descripciones-perdidas.py` (los tres últimos scripts de
  la base de datos; los anteriores quedaron obsoletos y se eliminaron).
- **`pages/calculadora-ia.html`** — asistente de presupuestos por chat con
  búsqueda en lenguaje natural (`js/search.js`). Usa
  **`data/base-precios.json`** (~19 MB, mismas 61.447 partidas, en array
  plano) vía `js/precios-loader.js`, con versiones comprimidas
  `.json.gz`/`.json.br`. También la usa `pages/base-precios-listado.html`.

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
