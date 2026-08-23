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

## Ficheros de datos grandes — cuidado

`BCEXTGREM_26.json` (~18 MB) y `precios.json` (~19 MB) son bases de precios
de construcción (banco de precios BCEXTREM 2026) usadas por
`presupuesto_v2.html`. **No los leas enteros** con Read — usa `Grep`/`head`/
`jq` para consultar entradas concretas, o se desperdicia el contexto.

`anuncios.json` (compraventa de maquinaria) y `catalogo.json` (schema.org
para SEO) son pequeños y sí se pueden leer completos.

## Despliegue

`git push` a `main` → GitHub Actions (`.github/workflows/deploy.yml`) publica
automáticamente en GitHub Pages (`www.obratudela.com`) en menos de un
minuto. No hay entorno de staging: cualquier cambio en `main` es producción.
Ten cuidado especial con cambios en `presupuesto_v2.html` (calculadora de
presupuestos que usan clientes reales) y en los datos de `anuncios.json`
(anuncios activos de venta/alquiler de maquinaria).
