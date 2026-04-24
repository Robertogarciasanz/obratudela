# ObraTudela — Web Corporativa

Sitio web de **Excavaciones y Servicios Arturo S.L.**, empresa de excavaciones, movimiento de tierras y obra civil en Tudela de Duero, Valladolid.

🌐 **[www.obratudela.com](https://www.obratudela.com)**

---

## Estructura del proyecto

```
/
├── index.html                      # Página principal
├── aviso-legal.html                # Aviso legal y política de privacidad
├── presupuesto BCEXTREM 2026.html  # Gestor de presupuestos (versión en uso)
├── presupuesto_v2.html             # Gestor de presupuestos v2
├── logo.jpg                        # Logo de la empresa
├── excavadora mixta.webp           # Imagen hero y galería (WebP optimizado)
├── retro pequeña.webp              # Imagen galería (WebP optimizado)
├── Gemini_Generated_Image_*.webp   # Imagen galería (WebP optimizado)
├── robots.txt                      # Directivas para motores de búsqueda
├── sitemap.xml                     # Mapa del sitio para SEO
├── CNAME                           # Dominio personalizado (www.obratudela.com)
├── wrangler.jsonc                  # Configuración de Cloudflare Workers
└── fonts/                          # Fuentes autoalojadas (sin dependencia de Google Fonts)
    ├── bebas-neue-400-latin.woff2
    ├── bebas-neue-400-latin-ext.woff2
    ├── ibm-plex-sans-300-latin.woff2
    ├── ibm-plex-sans-300-latin-ext.woff2
    ├── ibm-plex-sans-400-latin.woff2
    ├── ibm-plex-sans-400-latin-ext.woff2
    ├── ibm-plex-sans-600-latin.woff2
    └── ibm-plex-sans-600-latin-ext.woff2
```

---

## Despliegue

El sitio se despliega automáticamente en **Cloudflare Workers** al hacer `git push` a la rama `main`.

```bash
git add .
git commit -m "descripción del cambio"
git push
```

Cloudflare detecta el push, ejecuta `npx wrangler versions upload` usando `wrangler.jsonc` y publica los archivos estáticos en `www.obratudela.com` en menos de un minuto.

---

## Optimizaciones de rendimiento

| Técnica | Detalle |
|---|---|
| Imágenes WebP | PNG originales (27 MB) convertidos a WebP (~2 MB) — 92% de reducción |
| Fuentes autoalojadas | Bebas Neue e IBM Plex Sans servidas desde `/fonts/` sin bloqueo de renderizado |
| Preload de recursos críticos | Hero image y fuentes principales precargadas con `<link rel="preload">` |
| Lazy loading | Imágenes de galería y logo del footer con `loading="lazy"` |
| Google Maps diferido | El iframe del mapa carga solo cuando el usuario hace scroll hasta la sección (IntersectionObserver) |
| Dimensiones explícitas | Todos los `<img>` tienen `width` y `height` para eliminar CLS |

---

## SEO

- Meta tags `description`, `keywords`, `robots` y Open Graph en `index.html`
- `sitemap.xml` con todas las URLs del sitio
- `robots.txt` con referencia al sitemap
- URL canónica apuntando a `https://www.obratudela.com/`

---

## Accesibilidad

- Landmark `<main>` envolviendo el contenido principal
- Jerarquía de encabezados secuencial: `h1 → h2 → h3`
- Atributos `alt` descriptivos en todas las imágenes
- Navegación por teclado con menú hamburguesa accesible

---

## Empresa

| | |
|---|---|
| **Razón social** | Excavaciones y Servicios Arturo S.L. |
| **NIF** | B47489612 |
| **Dirección** | Calle Manzano, 2 — 47320 Tudela de Duero, Valladolid |
| **Teléfono** | 607 444 903 |
| **Email** | excavacionesart@gmail.com |
