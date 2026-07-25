# AGENTS.md

## Propósito
Este repositorio contiene el sitio web estático de ObraTudela (Excavaciones y Servicios Arturo S.L., Tudela de Duero, Valladolid), con páginas HTML, CSS, JavaScript y datos en JSON. El agente debe ayudar a mantener el contenido, la estructura y el funcionamiento del sitio sin romper el despliegue en GitHub Pages ni el panel de administración local.

## Datos de la empresa
- Nombre: Excavaciones y Servicios Arturo S.L. (ObraTudela)
- NIF: B47489612
- Dirección: Calle Manzano, 2 — 47320 Tudela de Duero, Valladolid
- Teléfono: 607 444 903
- Email: excavacionesart@gmail.com
- Web: https://www.obratudela.com

## Convenciones del proyecto
- Sitio web estático simple, sin herramientas de compilación.
- Priorizar cambios pequeños y compatibles con navegadores modernos.
- Mantener el contenido en español y con tono corporativo.
- No añadir dependencias nuevas salvo que sean estrictamente necesarias.
- Preferir modificar HTML, CSS y JS existentes antes que crear estructuras nuevas.
- Colores de marca: naranja #ff6b00 sobre fondos oscuros/claros según página.

## Páginas principales
- index.html: portada, navegación, servicios, galería de trabajos y contacto.
- calculadora-presupuestos.html: **presupuestos con IA**. Una sola pestaña. El usuario describe el proyecto en texto libre; el sistema valida los datos (cantidad, profundidad, espesor) y pregunta lo que falte antes de calcular. Detecta: excavaciones/zanjas, pavimentos, drenajes, demoliciones, desbroces. Precios embebidos en el propio archivo (BCEXTREM 2026), sin fetch externo. Incluye impresión con logo y datos de empresa.
- presupuesto_v2.html: gestor profesional de presupuestos (enlace "Presupuestos" del menú).
- obras.html: obras y reformas integrales, con galería (incluye fotos de reforma de cocina).
- alquileres.html, anuncios.html, topografia.html: páginas de contenido.
- aviso-legal.html: texto legal.

## Navegación (mantener siempre)
- Menú escritorio: Inicio · Servicios (desplegable: Obras y Reformas, Alquileres, Anuncios, Topografía) · Contacto · Presupuestos (presupuesto_v2.html) · Presupuesto con IA (botón destacado).
- Menú móvil: los mismos enlaces, incluido "Obras y Reformas". Si se añade una página nueva, añadirla a AMBOS menús.

## Datos
- precios.json: base de precios BCEXTREM 2026 (54.777 partidas, ~19 MB). No cargarlo con fetch desde páginas públicas: es demasiado grande. Los precios usados por las calculadoras van embebidos en el HTML.
- catalogo.json: maquinaria en alquiler (71 equipos).
- anuncios.json: anuncios de compraventa.

## Reglas de edición
- Mantener rutas relativas válidas y compatibles con GitHub Pages.
- Las imágenes usan .webp con srcset (variantes -400w y -800w en /img).
- No eliminar enlaces de navegación existentes al modificar menús.
- No cambiar el diseño de forma brusca; conservar la identidad visual.
- Nuevos scripts sin herramientas de compilación.
- Si se cambian APIs o formatos de datos, comprobar que siguen funcionando el panel de administración y las páginas existentes.

## Validación antes de dar algo por terminado
- Abrir la página en un navegador o servirla localmente (python -m http.server).
- Comprobar los menús en versión escritorio Y móvil.
- Tras un push, verificar la página EN VIVO en www.obratudela.com (GitHub Pages tarda 1-3 minutos en desplegar). No dar nada por subido sin comprobarlo.
- Panel de administración: node admin-server.js → http://localhost:3000

## Despliegue y git
- Despliegue automático con GitHub Pages desde la rama main (repo: Robertogarciasanz/obratudela).
- Agrupar los cambios en UN solo commit/push por sesión de trabajo, no un push por cada retoque.
- Si git falla con "index.lock" o "HEAD.lock", borrar esos archivos de .git/ y reintentar.
- Si el push es rechazado, hacer git pull antes (con -X ours si hay que conservar lo local).
- Evitar cambios que rompan la generación o el acceso a los archivos estáticos.
