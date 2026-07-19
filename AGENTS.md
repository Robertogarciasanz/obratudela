# AGENTS.md

## Propósito
Este repositorio contiene un sitio web estático de ObraTudela, con páginas HTML, CSS, JavaScript y datos en JSON. El agente debe ayudar a mantener el contenido, la estructura y el funcionamiento del sitio sin romper el despliegue en GitHub Pages ni el panel de administración local.

## Convenciones del proyecto
- El sitio está pensado para funcionar como una web estática simple.
- Prioriza cambios pequeños y compatibles con navegadores modernos.
- Mantén el contenido en español y con tono corporativo.
- Evita añadir dependencias nuevas salvo que sean estrictamente necesarias.
- Preferir modificaciones en HTML, CSS y JS existentes antes que crear nuevas estructuras complejas.

## Archivos importantes
- index.html: portada y navegación principal.
- anuncios.html, alquileres.html, obras.html, topografia.html, presupuesto_v2.html: páginas de contenido.
- css/: estilos globales y por página.
- js/: lógica de interacción y carga de datos.
- anuncios.json, precios.json, catalogo.json: fuentes de datos para las páginas.
- admin-server.js: panel local de administración y APIs internas.

## Reglas de edición
- Mantén rutas relativas válidas y compatibles con GitHub Pages.
- Si cambias APIs o formatos de datos, comprueba que siguen funcionando con el panel de administración y con las páginas existentes.
- No cambies el diseño de forma brusca sin conservar la identidad visual del sitio.
- Si añades nuevos scripts, asegúrate de que no dependan de herramientas de compilación.

## Validación recomendada
- Para revisar cambios estáticos, abrir el proyecto en un navegador o servirlo localmente.
- Para el panel de administración, ejecutar:
  - node admin-server.js
  - abrir http://localhost:3000

## Notas de despliegue
- El despliegue se hace mediante GitHub Pages desde la rama principal.
- Evita introducir cambios que rompan la generación o el acceso a los archivos estáticos.
