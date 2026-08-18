# 📚 Documentación ObraTudela

**Excavaciones y Servicios Arturo S.L.**
Última actualización: Agosto 2026

---

## 📑 Índice

1. [Información de la Empresa](#información-de-la-empresa)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Base de Precios](#base-de-precios)
4. [Google Tag Manager](#google-tag-manager)
5. [Estado del Proyecto](#estado-del-proyecto)

---

## 1. Información de la Empresa

### Datos Corporativos
- **Nombre comercial:** ObraTudela
- **Razón social:** Excavaciones y Servicios Arturo S.L.
- **NIF:** B47489612
- **Dirección:** Calle Manzano, 2 — 47320 Tudela de Duero, Valladolid
- **Teléfono:** 607 444 903
- **Email:** excavacionesart@gmail.com
- **Web:** https://www.obratudela.com

### Servicios
- Excavaciones y movimiento de tierras
- Demoliciones
- Alquileres de maquinaria
- Topografía
- Presupuestos de obra

---

## 2. Estructura del Proyecto

### Tecnología
- **Tipo:** Sitio web estático
- **Hosting:** GitHub Pages
- **Deploy:** Automático desde rama `main`
- **No usa:** Node.js, compiladores, bundlers

### Convenciones de Código
- ✅ Cambios pequeños e incrementales
- ✅ Compatible con navegadores modernos
- ✅ Contenido en español, tono corporativo
- ✅ Sin dependencias innecesarias
- ✅ Modificar antes que crear nuevo
- ✅ Color marca: naranja `#ff6b00`

### Estructura de Archivos

```
obratudela/
├── 📄 index.html              (Página principal)
├── 📂 pages/                  (Páginas HTML)
│   ├── calculadora-presupuestos.html
│   ├── gestor-presupuestos.html
│   ├── alquileres.html
│   ├── obras.html
│   └── ...
├── 📂 data/                   (Datos JSON y BC3)
│   ├── base-precios.json      (61,835 partidas)
│   └── BASE_PRECIOS_UNIFICADA.bc3
├── 📂 scripts/                (Scripts Python)
│   ├── convert-bc3-to-json.py
│   └── ...
├── 📂 css/                    (Estilos)
├── 📂 js/                     (JavaScript)
└── 📂 img/                    (Imágenes)
```

---

## 3. Base de Precios

### Estadísticas
- **Total partidas:** 61,835
- **Con precio:** 6,512
- **Capítulos:** 12

### Fuentes de Datos
1. **BCCA Andalucía 2024** (Base oficial - Junta de Andalucía)
2. **CYPE Generador de Precios** (Instalaciones y cimentaciones)
3. **Base histórica** (Partidas acumuladas)

### Estructura de Capítulos

#### Capítulo 01: Demoliciones y Trabajos Previos 🔨
- Categorías: `DEMOLICION`, `R0`
- Incluye: demoliciones, retiradas, desmontajes

#### Capítulo 02: Movimiento de Tierras 🚜
- Categorías: `CARGA`, `EXCAVACION`, `TRANSPORTE`
- Incluye: desbroce, excavaciones, rellenos, transporte

#### Capítulo 03: Cimentaciones 🏗️
- Categorías: `CIMENTACION`, `ZAPATA`, `HORMIGON`
- Incluye: zapatas, vigas, losas, muros

#### Capítulo 04: Saneamiento 💧
- Categorías: `SANEAMIENTO`, `TUBERIA`, `ARQUETA`
- Incluye: tuberías, arquetas, pozos

#### Capítulo 05: Estructuras 🏢
- Categorías: `ESTRUCTURA`, `FORJADO`, `VIGA`
- Incluye: hormigón armado, acero, madera

#### Capítulo 06: Instalaciones ⚡
- Categorías: `ELECTRICIDAD`, `FONTANERIA`, `CLIMATIZACION`
- Subcapítulos:
  - 06.1 Electricidad y telecomunicaciones
  - 06.2 Fontanería y ACS
  - 06.3 Climatización y ventilación

#### Capítulo 07: Albañilería 🧱
- Categorías: `CERRAMIENTO`, `TABIQUE`, `REVESTIMIENTO`
- Incluye: cerramientos, particiones, enfoscados

#### Capítulo 08: Carpintería y Cerrajería 🚪
- Categorías: `CARPINTERIA`, `PUERTA`, `VENTANA`
- Incluye: puertas, ventanas, cerrajería

#### Capítulo 09: Revestimientos 🎨
- Categorías: `SOLADO`, `ALICATADO`, `PINTURA`
- Incluye: pavimentos, alicatados, pinturas

#### Capítulo 10: Urbanización 🌳
- Categorías: `URBANIZACION`, `PAVIMENTO`, `JARDINERIA`
- Incluye: viales, aceras, mobiliario urbano

#### Capítulo 11: Seguridad y Salud 🦺
- Categorías: `SEGURIDAD`, `PROTECCION`
- Incluye: protecciones, señalización, equipos

#### Capítulo 12: Gestión de Residuos ♻️
- Categorías: `RESIDUOS`, `GESTION`
- Incluye: contenedores, transporte, gestión

### Formato de Archivos

#### BC3 (FIEBDC-3)
```
~V|FIEBDC-3/2007|CYPE|BASE DE PRECIOS|CPG2007|EUR|
~C|codigo|unidad|resumen|precio|
~T|codigo||tipo|
~D|codigo|descripcion|
```

#### JSON
```json
{
  "cod": "01AAB00001",
  "uni": "m2",
  "res": "Demolición de bóveda catalana",
  "pre": 15.89,
  "desc": "Descripción completa...",
  "tipo": 0
}
```

### Scripts de Conversión

**convert-bc3-to-json.py** - Conversor BC3 → JSON
```bash
python scripts/convert-bc3-to-json.py archivo.bc3 salida.json
```

**combinar-bases-precios.py** - Fusiona múltiples JSON
```bash
python scripts/combinar-bases-precios.py bcca.json cype.json
```

---

## 4. Google Tag Manager

### Configuración Actual

**Container ID:** GTM-XXXXXX (configurado en todas las páginas HTML)

### Implementación

**En `<head>`:**
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXX');</script>
<!-- End Google Tag Manager -->
```

**Después de `<body>`:**
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

### Tags Configurados

1. **Google Analytics 4**
   - Property ID: G-XXXXXXXXXX
   - Eventos de página automáticos

2. **Eventos Personalizados**
   - Click en botones de presupuesto
   - Descarga de catálogos
   - Envío de formularios

### Importar Configuración

Archivo: `GTM-Container-Export.json` (si existe en git history)

**Pasos:**
1. Acceder a tagmanager.google.com
2. Seleccionar contenedor
3. Admin → Importar contenedor
4. Subir archivo JSON
5. Elegir espacio de trabajo
6. Previsualizar → Publicar

---

## 5. Estado del Proyecto

### Funcionalidades Implementadas ✅

#### Páginas Web
- ✅ Página principal responsive
- ✅ Calculadora de presupuestos (IA)
- ✅ Gestor de presupuestos avanzado
- ✅ Catálogo de alquileres
- ✅ Galería de obras
- ✅ Servicios de topografía

#### Base de Precios
- ✅ 61,835 partidas unificadas
- ✅ Búsqueda y filtrado
- ✅ Exportación a PDF
- ✅ Conversión BC3 ↔ JSON

#### Optimizaciones
- ✅ Compresión Brotli/Gzip
- ✅ Lazy loading de imágenes
- ✅ Minificación de recursos
- ✅ Service Worker (caché)

#### Analítica
- ✅ Google Tag Manager
- ✅ Google Analytics 4
- ✅ Eventos personalizados

### Pendientes / Mejoras ⏳

#### Funcionalidades
- ⏳ Sistema de login para clientes
- ⏳ Historial de presupuestos
- ⏳ API REST para consultas
- ⏳ Integración con CRM

#### Optimizaciones
- ⏳ Imágenes en formato WebP
- ⏳ Critical CSS inline
- ⏳ Precarga de recursos

#### Contenido
- ⏳ Blog de noticias
- ⏳ Casos de éxito detallados
- ⏳ Vídeos de obras

### Próximos Pasos 🎯

1. **Corto plazo** (1-2 semanas)
   - Reorganizar estructura de archivos
   - Actualizar imágenes a WebP
   - Optimizar rendimiento móvil

2. **Medio plazo** (1-2 meses)
   - Implementar sistema de usuarios
   - Crear API de presupuestos
   - Añadir más funcionalidades al gestor

3. **Largo plazo** (3-6 meses)
   - Integración con ERP/CRM
   - App móvil nativa
   - Marketplace de servicios

---

## 📞 Contacto de Desarrollo

Para consultas técnicas sobre el proyecto:
- **Repositorio:** https://github.com/Robertogarciasanz/obratudela
- **Issues:** https://github.com/Robertogarciasanz/obratudela/issues

---

## 📝 Notas de Versión

### v2.0 (Agosto 2026)
- Base de precios unificada (61,835 partidas)
- Reorganización de estructura de archivos
- Documentación consolidada

### v1.5 (Julio 2026)
- Integración Google Tag Manager
- Optimizaciones de rendimiento
- Nuevas calculadoras

### v1.0 (Enero 2026)
- Lanzamiento inicial
- Páginas principales
- Base de precios BCCA

---

**Fin de la documentación**
