# Instrucciones para GitHub Copilot

## Contexto del proyecto

ObraTudela es un sitio web estático para una empresa de excavaciones y servicios de construcción en Tudela de Duero, Valladolid.

### Tecnologías principales
- **Frontend**: HTML5, CSS3, JavaScript vanilla (sin frameworks)
- **Backend local**: Node.js (solo desarrollo, no en producción)
- **Deploy**: GitHub Pages (estático)
- **Bases de datos**: JSON estáticos (BCEXTREM + BCCA)

## Estructura de datos importantes

### Base de precios de construcción
```javascript
// Estructura de partida
{
  "cod": "01ALM90003",           // Código único BCEXTREM/BCCA
  "uni": "m3",                   // Unidad (m3, m2, ml, ud, %)
  "res": "DEMOLICIÓN...",        // Descripción resumida
  "precio": 91.34,               // Precio unitario €
  "desc": "Demolición de..."     // Descripción completa (opcional)
}
```

### Archivos clave
- `base-precios.json`: 59,915 partidas completas (18 MB)
- `precios-busqueda.json`: 59,915 partidas sin desc (5.65 MB)
- `*.json.gz`: Versiones gzip para optimización
- `*.json.br`: Versiones brotli (mejor compresión)

## Optimizaciones implementadas

### 1. Compresión de archivos
- **Script**: `scripts/compress-precios.cjs`
- **Formatos**: gzip (nivel 9) y brotli (nivel 11)
- **Uso**: `node scripts/compress-precios.cjs`

### 2. Sistema de caché versionado
- **Ubicación**: `calculadora-ia.html` (líneas 611-654)
- **Version**: `CACHE_VERSION = '2026.1'`
- **Storage**: sessionStorage con invalidación automática
- **Max age**: 7 días

### 3. Carga con fallback inteligente
```javascript
// Orden de prioridad
1. precios-busqueda.json.gz  → 0.86 MB (óptimo)
2. precios-busqueda.json     → 5.65 MB
3. base-precios.json.gz      → 1.82 MB (con desc)
4. base-precios.json         → 18 MB
5. PARTIDAS_FALLBACK         → 46 partidas (offline)
```

## Patrones de código

### Búsqueda heurística (NO usa LLM)
```javascript
// calculadora-ia.html usa keyword matching local
function buscarPartidas(descripcion) {
  const stopwords = ['de', 'del', 'la', 'el', ...];
  const keywords = descripcion.toLowerCase()
    .split(/\s+/)
    .filter(word => !stopwords.includes(word));

  // Scoring por coincidencias
  // NO hace llamadas a servicios externos
}
```

### Gestor de presupuestos
- **Archivo**: `gestor-presupuestos.html` (2.49 MB)
- **Datos**: DATA_B64 embebido comprimido con gzip
- **Librería**: pako.js para descompresión cliente

## Archivos gitignored (desarrollo local)

Estos archivos NO están en el repo:
- `admin-server.js`: Servidor Node.js local
- `package.json`: Dependencias (express, cors, multer, sharp)
- `iniciar-admin.bat`: Launcher Windows
- `node_modules/`: Dependencias npm

## Convenciones

### Commits
- Usar emojis: 🗜️ (compress), 💾 (cache), 🚀 (deploy), 🐛 (fix)
- Incluir medidas de rendimiento cuando aplique
- Marcar como co-author: `Co-Authored-By: github-actions[bot]`

### Código JavaScript
- Preferir vanilla JS sobre frameworks
- Comentarios descriptivos en español
- console.log con emojis para debugging visual
- Manejo robusto de errores (try/catch)

### HTML
- Semántico con schema.org
- Fuentes autoalojadas (no CDN)
- CSS variables para theming
- Optimizar imágenes (WebP + fallback)

## Próximas optimizaciones sugeridas

1. **Índice invertido**: search-index.json (~200 KB vs 5.65 MB)
2. **Web Worker**: Búsqueda sin bloquear UI
3. **Lazy-loading**: Cargar por capítulos (~80-150 KB/capítulo)
4. **IndexedDB**: Si sessionStorage resulta insuficiente

## Comandos útiles

```bash
# Comprimir archivos manualmente
node scripts/compress-precios.cjs

# Servidor local
python -m http.server 8000

# Deploy automático (push a main)
git push origin main
```

## Links de referencia

- **Producción**: https://www.obratudela.com
- **BCEXTREM**: Base oficial Extremadura
- **BCCA**: Base oficial Andalucía (Junta)
- **BC3 (FIEBDC-3)**: Formato estándar español

## Notas importantes

⚠️ **NO usar**:
- Frameworks frontend (React, Vue, Angular)
- Servicios LLM externos en producción
- npm packages en código cliente
- Backend dinámico (GitHub Pages es estático)

✅ **SÍ usar**:
- JavaScript vanilla moderno (ES6+)
- Optimizaciones de rendimiento
- Progressive enhancement
- Accesibilidad (ARIA)
