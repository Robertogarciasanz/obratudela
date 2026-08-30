# Instrucciones para GitHub Copilot

## Contexto del proyecto

ObraTudela es un sitio web estático para una empresa de excavaciones y servicios de construcción en Tudela de Duero, Valladolid. No es una empresa de software: trátalo como una web corporativa sencilla, sin frameworks ni build step, pensada para que un no-programador (el dueño del negocio) pueda entender y tocar los archivos si hace falta.

### Tecnologías principales
- **Frontend**: HTML5, CSS3, JavaScript vanilla (sin frameworks)
- **Backend local**: `admin-server.js` con Node.js puro (solo desarrollo local del dueño del negocio, gitignored, no en producción)
- **Deploy**: GitHub Pages (estático), automático al hacer push a `main`
- **Bases de datos**: JSON estáticos (banco de precios BCEXTREM 2026)

## Estructura de datos importantes

### Base de precios de construcción
```javascript
// Estructura de partida
{
  "cod": "01ALM90003",           // Código único BC3 (BCEXTREM 2026)
  "uni": "m3",                   // Unidad (m3, m2, ml, ud, %)
  "res": "DEMOLICIÓN...",        // Descripción resumida
  "precio": 91.34,               // Precio unitario €
  "desc": "Demolición de..."     // Descripción completa (opcional, ~99% de las partidas la tienen)
}
```

### Dos herramientas independientes, cada una con su propia copia de los datos
- **`pages/gestor-presupuestos.html`**: herramienta principal, la usan clientes reales. Lleva las 61.447 partidas **incrustadas dentro del propio HTML** en la variable `DATA_B64` (JSON comprimido con zlib + base64, descomprimido en el navegador con pako.js). Para actualizarla hay que descomprimir ese bloque, modificarlo y recomprimirlo — ver `scripts/actualizar-gestor-2026.py`, `scripts/reclasificar-oficios.py` y `scripts/recuperar-descripciones-perdidas.py`.
- **`pages/calculadora-ia.html`**: asistente de presupuestos por chat con búsqueda en lenguaje natural. Usa **`data/base-precios.json`** (~19 MB, mismas 61.447 partidas en array plano) cargado vía `js/precios-loader.js`, con versiones comprimidas `data/base-precios.json.gz` y `.br`. También la usa `pages/base-precios-listado.html`.

Estas dos bases **no se sincronizan solas** — si actualizas una base de precios hay que regenerar las dos por separado.

## Optimizaciones implementadas

### 1. Compresión de `data/base-precios.json`
Se genera a mano tras cada actualización (no hay workflow automático):
```bash
python3 -c "import gzip; d=open('data/base-precios.json','rb').read(); open('data/base-precios.json.gz','wb').write(gzip.compress(d, compresslevel=9))"
node -e "const fs=require('fs'),zlib=require('zlib'); const d=fs.readFileSync('data/base-precios.json'); fs.writeFileSync('data/base-precios.json.br', zlib.brotliCompressSync(d,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:11}}))"
```

### 2. Sistema de caché versionado
- **Ubicación**: `js/precios-loader.js`
- **Version**: `CACHE_VERSION` (súbela al regenerar `base-precios.json`, y añade el mismo `?v=` a los imports de módulos en `js/main.js` — si no, quien ya visitó la página sigue viendo la base vieja cacheada por el navegador)
- **Storage**: sessionStorage con invalidación automática
- **Max age**: 7 días

### 3. Carga con fallback inteligente (`js/precios-loader.js`)
```
1. data/base-precios.json.gz  → óptimo
2. data/base-precios.json.br  → mejor compresión si el navegador la soporta
3. data/base-precios.json     → sin comprimir, último recurso
4. PARTIDAS_FALLBACK          → ~50 partidas embebidas (offline / file://)
```

## Patrones de código

### Búsqueda heurística (NO usa LLM)
`js/search.js`, función `buscarPartidas()`: tokeniza la consulta, expande con un diccionario de sinónimos en español, puntúa por coincidencias en código/resumen/descripción y penaliza partidas de demolición/desmontaje cuando la consulta no pide expresamente quitar algo. Sin llamadas a servicios externos. Recorre siempre toda la base (no hay límite de "primeros N candidatos": un límite así hacía que, al estar los datos ordenados por código, coincidencias débiles de los primeros códigos taparan partidas mucho mejores más adelante en la lista).

### Gestor de presupuestos
- **Archivo**: `pages/gestor-presupuestos.html`
- **Datos**: `DATA_B64` embebido, comprimido con zlib (no gzip) + base64
- **Librería**: pako.js (`pako.inflate`) para descompresión cliente

## Fallo recurrente a vigilar: rutas relativas sin `../`

Varias páginas dentro de `pages/` han tenido bugs por usar `fetch('fonts/x.woff2')` o `<img src="img/logo.jpg">` en vez de `../fonts/...` / `../img/...` — la ruta se resuelve relativa a `pages/`, no a la raíz del sitio, y el recurso da 404 en silencio. Es lo primero a comprobar si algo no carga en una página dentro de `pages/`.

## Archivos gitignored (desarrollo local)

Estos archivos NO están en el repo:
- `admin-server.js`: Servidor Node.js local (gestiona `anuncios.json`)
- `iniciar-admin.bat`: Launcher Windows
- `package.json` / `node_modules/`: Dependencias npm

`anuncios.json` actualmente **no existe** en el repo (aunque no está gitignored) — `js/anuncios.js` hace `fetch('anuncios.json')` y la página de anuncios no carga listados. Antes de "arreglarlo" creando un archivo vacío, consigue los datos reales de los anuncios activos; un archivo vacío "soluciona" el error pero deja la página sin anuncios, que es peor.

## Convenciones

### Commits
- Mensajes descriptivos en español, explicando el porqué del cambio
- Marcar como co-author: `Co-Authored-By: <nombre del asistente> <email>`

### Código JavaScript
- Preferir vanilla JS sobre frameworks
- Comentarios descriptivos en español, solo cuando el "por qué" no sea obvio
- Manejo robusto de errores (try/catch) en operaciones que puedan fallar (fetch, window.open, etc.)

### HTML
- Semántico con schema.org donde aporte SEO real
- Fuentes autoalojadas (no CDN de Google Fonts) — ver `css/global.css`
- CSS variables para theming
- Comprobar siempre rutas relativas dentro de `pages/`

## Notas importantes

⚠️ **NO usar**:
- Frameworks frontend (React, Vue, Angular)
- Servicios LLM externos en producción (la búsqueda de `calculadora-ia.html` es heurística local, no llama a ninguna IA)
- npm packages en código cliente
- Backend dinámico (GitHub Pages es estático)

✅ **SÍ usar**:
- JavaScript vanilla moderno (ES6+)
- Progressive enhancement
- Accesibilidad (ARIA) donde sea sencillo añadirla
