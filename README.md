# ObraTudela — Web Corporativa

Sitio web de **Excavaciones y Servicios Arturo S.L.**, empresa de excavaciones, movimiento de tierras y obra civil en Tudela de Duero, Valladolid.

**[www.obratudela.com](https://www.obratudela.com)**

---

## Estructura del proyecto

```
/
├── index.html              # Página principal
├── anuncios.html           # Portal de compraventa de maquinaria
├── alquileres.html         # Catálogo de alquiler de maquinaria
├── presupuesto_v2.html     # Gestor de presupuestos (BCEXTREM 2026)
├── topografia.html         # Servicios de topografía
├── aviso-legal.html        # Aviso legal y política de privacidad
├── anuncios.json           # Base de datos de anuncios
├── precios.json            # Base de precios BCEXTREM
├── catalogo.json           # Catálogo schema.org de maquinaria
├── CNAME                   # Dominio personalizado
├── robots.txt              # Directivas para motores de búsqueda
├── sitemap.xml             # Mapa del sitio para SEO
├── admin-server.js         # Servidor local del panel de administración
├── iniciar-admin.bat       # Lanzador del panel de administración
├── fonts/                  # Fuentes autoalojadas (Bebas Neue + IBM Plex Sans)
└── img/                    # Imágenes (hero, galería, fotos de anuncios)
```

---

## Despliegue

El sitio se despliega automáticamente en **GitHub Pages** al hacer `git push` a la rama `main`.

```bash
git add .
git commit -m "descripción del cambio"
git push
```

GitHub Actions ejecuta el workflow `.github/workflows/deploy.yml` y publica en `www.obratudela.com` en menos de un minuto.

---

## Panel de administración (local)

Para gestionar anuncios desde el ordenador, ejecutar `iniciar-admin.bat`. Abre Edge en modo app y arranca el servidor local en `http://localhost:3000`.

---

## Empresa

| | |
|---|---|
| **Razón social** | Excavaciones y Servicios Arturo S.L. |
| **NIF** | B47489612 |
| **Dirección** | Calle Manzano, 2 — 47320 Tudela de Duero, Valladolid |
| **Teléfono** | 607 444 903 |
| **Email** | excavacionesart@gmail.com |
