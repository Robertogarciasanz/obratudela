# ObraTudela — Web Corporativa

Sitio web de **Excavaciones y Servicios Arturo S.L.**, empresa de excavaciones, movimiento de tierras y obra civil en Tudela de Duero, Valladolid.

**[www.obratudela.com](https://www.obratudela.com)**

---

## 🚀 Características Principales

### ⚡ Presupuestador Profesional con Desgloses
- **53,403 partidas** de la base de datos BCEXTREM 2026
- **Visualización de desgloses completos**: Mano de Obra, Materiales y Maquinaria
- **30,300 descomposiciones** con costes directos e indirectos
- Búsqueda fuzzy con tolerancia a errores
- Organización jerárquica por oficios (12 capítulos)
- Exportación a Excel e impresión profesional
- Sistema de caché inteligente para carga rápida

### 📢 Portal de Anuncios
- Compraventa de maquinaria de construcción
- Panel de administración local con subida automática a GitHub Pages
- Gestión de imágenes optimizadas automáticamente

### 🏗️ Catálogo de Alquileres
- Maquinaria disponible con precios
- Marcado schema.org para SEO

---

## 📁 Estructura del Proyecto

```
/
├── index.html                      # Página principal
├── anuncios.html                   # Portal de compraventa de maquinaria
├── admin_anuncios.html            # Panel de administración de anuncios
├── alquileres.html                 # Catálogo de alquiler de maquinaria
├── presupuesto_v2.html             # ⭐ Gestor de presupuestos con desgloses
├── obras.html                      # Galería de obras realizadas
├── topografia.html                 # Servicios de topografía
├── aviso-legal.html                # Aviso legal y política de privacidad
│
├── admin-server.js                 # Servidor Node.js con API REST
├── convert-bc3-to-json.py          # Conversor de archivos BC3 (FIEBDC-3)
│
├── anuncios.json                   # Base de datos de anuncios
├── precios.json                    # Base de precios BCEXTREM 2026 (19 MB)
├── precios-con-desgloses.json      # Base con desgloses completos (28 MB)
├── catalogo.json                   # Catálogo schema.org de maquinaria
├── capitulos-map.json              # Mapeo de capítulos por oficios
│
├── package.json                    # Dependencias Node.js
├── CNAME                           # Dominio personalizado
├── robots.txt                      # Directivas para motores de búsqueda
├── sitemap.xml                     # Mapa del sitio para SEO
│
├── fonts/                          # Fuentes autoalojadas
│   ├── BebasNeue-Regular.woff2
│   ├── IBMPlexSans-*.woff2
│   └── IBMPlexMono-*.woff2
│
├── img/                            # Imágenes
│   ├── hero/                       # Imágenes del hero
│   ├── anuncios/                   # Fotos de anuncios
│   ├── obras/                      # Galería de obras
│   └── logo.jpg                    # Logo de la empresa
│
├── css/                            # Estilos (si existen)
├── js/                             # Scripts del cliente (si existen)
│
└── .github/
    └── workflows/
        └── deploy.yml              # Despliegue automático a GitHub Pages
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5** semántico con marcado schema.org
- **CSS3** moderno (variables CSS, Grid, Flexbox)
- **JavaScript** vanilla (sin frameworks)
- **XLSX.js** para exportación a Excel

### Backend (Local)
- **Node.js** con servidor HTTP nativo
- **Python** para procesamiento de archivos BC3
- **API REST** para gestión de anuncios y desgloses

### Bases de Datos
- **BCEXTREM 2026**: Base oficial de precios de construcción en España
- **Formato BC3 (FIEBDC-3)**: Estándar español para intercambio de datos de construcción

### SEO y Rendimiento
- **Schema.org**: Marcado estructurado para productos y servicios
- **sessionStorage**: Caché de 19 MB para carga instantánea
- **Imágenes optimizadas**: WebP con fallback a JPG
- **Fuentes autoalojadas**: Sin dependencias externas de Google Fonts

---

## 🚀 Despliegue

El sitio se despliega **automáticamente** en GitHub Pages al hacer `git push` a la rama `main`.

```bash
git add .
git commit -m "Descripción del cambio"
git push
```

GitHub Actions ejecuta el workflow `.github/workflows/deploy.yml` y publica en **www.obratudela.com** en menos de un minuto.

---

## 💻 Panel de Administración (Solo Desarrollo Local)

⚠️ **Nota importante:** Los archivos del panel de administración (`admin-server.js`, `package.json`) están en `.gitignore` y **NO se incluyen en el repositorio público** por motivos de seguridad y porque solo son necesarios para desarrollo local.

### Para desarrolladores

Si necesitas el panel de administración para desarrollo local:

1. **Crear `package.json`:**
```json
{
  "name": "obratudela-admin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.0"
  }
}
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Solicitar `admin-server.js`** al propietario del proyecto (no incluido en repo público)

### Uso del panel (si tienes los archivos)

```bash
node admin-server.js
# O usando: iniciar-admin.bat
```

Acceder al panel: **http://localhost:3000**

### Funcionalidades
- ✅ Gestión de anuncios de maquinaria
- ✅ Subida de imágenes con optimización automática
- ✅ Publicación directa a GitHub Pages con un clic
- ✅ API REST para consulta de precios y desgloses

### API Endpoints

#### Precios
```
GET  /api/precios?q=excavacion&page=1
     → Búsqueda de partidas con paginación

GET  /api/precios/:codigo/desglose
     → Obtener desglose completo de una partida

     Respuesta:
     {
       "ok": true,
       "partida": { "cod": "Q09E010", "res": "...", "precio": 30.42 },
       "desglose": {
         "componentes": [
           { "tipo": "MO", "cod": "O01BL200", "descripcion": "...",
             "cantidad": 0.2, "precio_unitario": 20.69, "subtotal": 4.14 }
         ],
         "resumen": {
           "mano_obra": 8.17,
           "materiales": 14.25,
           "maquinaria": 0.00,
           "total_directo": 22.42,
           "precio_bd": 30.42,
           "indirectos": 8.00,
           "porcentaje_mo": 36.4,
           "porcentaje_mat": 63.6,
           "porcentaje_maq": 0.0
         }
       }
     }

QUERY /api/precios/search
      → Búsqueda avanzada (RFC 9535)

      Body:
      {
        "filters": {
          "text": "excavación",
          "capitulo": "02",
          "precio": { "min": 10, "max": 100 }
        },
        "sort": { "field": "precio", "order": "asc" },
        "pagination": { "page": 1, "limit": 50 }
      }
```

#### Anuncios
```
GET  /api/anuncios
     → Listar todos los anuncios

POST /api/anuncios
     → Crear nuevo anuncio (requiere admin_key)

PUT  /api/anuncios/:id
     → Actualizar anuncio (requiere admin_key)

DELETE /api/anuncios/:id
       → Eliminar anuncio (requiere admin_key)
```

#### Catálogo
```
GET  /api/catalogo?tipo=excavadoras&page=1
     → Listar maquinaria de alquiler
```

---

## 📊 Base de Datos BCEXTREM 2026

### Estadísticas
- **53,403 partidas** totales
- **27,732 partidas compuestas** con desgloses
- **30,300 descomposiciones** completas
- **129** recursos de mano de obra
- **31,428** materiales
- **1,638** maquinaria

### Organización por Capítulos
1. **01** — Demoliciones y Trabajos Previos (1,304 + 769 items)
2. **02** — Movimiento de Tierras y Excavaciones (80 items)
3. **03** — Cimentaciones y Estructuras (175 items)
4. **04** — Albañilería y Cerramientos (364 items)
5. **05** — Cubiertas e Impermeabilizaciones (235 items)
6. **06** — Instalaciones
   - **06.1** Electricidad e Iluminación (7,131 items)
   - **06.2** Fontanería y Saneamiento (5,575 items)
   - **06.3** Climatización y Ventilación (2,324 items)
7. **07** — Revestimientos, Enlucidos y Solados
8. **08** — Carpintería Exterior e Interior
9. **09** — Cerrajería y Vidriería
10. **10** — Pintura y Acabados
11. **11** — Gestión de Residuos y Seguridad/Salud (450 + 448 items)
12. **12** — Urbanización y Jardinería (1,054 items)
- **·** — Recursos (29,113 + 1,370 + 101 items)

### Conversión de Archivos BC3
El script `convert-bc3-to-json.py` convierte archivos BC3 (FIEBDC-3) a JSON con desgloses completos:

```bash
python convert-bc3-to-json.py ruta/al/archivo.bc3
```

Procesa:
- ✅ Registros C (Conceptos/Partidas)
- ✅ Registros D (Descomposiciones)
- ✅ Registros T (Textos descriptivos)
- ✅ Codificación Latin-1, CP850 y UTF-8
- ✅ Clasificación automática en MO, MAT, MAQ

---

## 🎨 Características de Diseño

### Presupuestador (presupuesto_v2.html)
- **Diseño oscuro moderno** con paleta naranja (#ff6b00)
- **Tipografía profesional**: IBM Plex Sans + IBM Plex Mono
- **Modal de desgloses** con:
  - Tarjetas de resumen con porcentajes
  - Gráfico de barras horizontal animado
  - Tabla detallada de componentes
  - Badges de tipo (MO/MAT/MAQ) con colores
- **Búsqueda en tiempo real** con fuzzy matching
- **Navegación jerárquica** por capítulos colapsables
- **Caché sessionStorage** para carga instantánea
- **Responsive** y adaptable a móviles

### Portal de Anuncios
- **Grid responsive** de tarjetas
- **Filtros por categoría** y provincia
- **Sistema de destacados**
- **Galería de imágenes** con lightbox
- **Botones de contacto** WhatsApp y teléfono

### Web Corporativa
- **Hero visual** con imagen de maquinaria
- **Secciones** de servicios, galería de obras
- **Diseño limpio** con estética industrial
- **CTA prominentes** para llamadas a la acción

---

## 📈 SEO y Performance

### Optimizaciones Implementadas
- ✅ Marcado schema.org (WebPage, SoftwareApplication, Product)
- ✅ Meta tags Open Graph para redes sociales
- ✅ Sitemap.xml con todas las páginas
- ✅ Robots.txt optimizado
- ✅ URLs canónicas
- ✅ Descripciones únicas por página
- ✅ Fuentes autoalojadas (sin llamadas externas)
- ✅ Imágenes optimizadas y lazy loading
- ✅ Caché de base de datos (19 MB en sessionStorage)

### Performance
- **First Load**: ~3s (carga inicial de 19 MB)
- **Subsequent Loads**: <100ms (desde caché)
- **Search Performance**: <50ms (53,403 items indexados)

---

## 🏢 Empresa

| | |
|---|---|
| **Razón social** | Excavaciones y Servicios Arturo S.L. |
| **NIF** | B47489612 |
| **Dirección** | Calle Manzano, 2 — 47320 Tudela de Duero, Valladolid |
| **Teléfono** | 607 444 903 |
| **Email** | excavacionesart@gmail.com |
| **Web** | [www.obratudela.com](https://www.obratudela.com) |

---

## 📝 Documentación Adicional

- **[ESTRUCTURA-CAPITULOS.md](ESTRUCTURA-CAPITULOS.md)** — Organización completa de la base de precios por oficios
- **[AGENTS.md](AGENTS.md)** — Configuración de agentes de IA para desarrollo

---

## 📄 Licencia

© 2026 Excavaciones y Servicios Arturo S.L. Todos los derechos reservados.

La base de datos BCEXTREM es propiedad de la Junta de Extremadura y se utiliza bajo licencia de uso.
