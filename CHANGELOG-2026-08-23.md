# Changelog - 23 de Agosto de 2026

## 🚀 Migración a Cloudflare Pages + Optimización para Buscadores de IA

### 📊 Actualización de Base de Datos

#### Números Corregidos
- **Antes**: 53,403 partidas (documentación desactualizada)
- **Después**: **61,835 partidas** (dato real verificado)
- **Partidas con desgloses**: 7,365 (NO 27,732)
- **Total descomposiciones**: 34,259 (NO 30,300)

#### Archivos Regenerados
- ✅ `data/base-precios.json.gz` - Actualizado con 61,835 partidas (1.79 MB)
- ✅ `data/base-precios-con-desgloses-completa.json` - Base completa con desgloses (26 MB)

### 🤖 Calculadora de IA - Corregida

#### Problemas Encontrados y Solucionados
1. **Rutas incorrectas**: Buscaba archivos en raíz, ahora busca en `/data/`
2. **Números desactualizados**: Mostraba 59,000 partidas, ahora muestra 61,835
3. **Archivos comprimidos**: Actualizados con la base completa

#### Archivos Modificados
- `js/precios-loader.js` - Rutas corregidas y números actualizados
- `pages/calculadora-ia.html` - Mensaje de bienvenida actualizado
- `data/base-precios.json.gz` - Recomprimido con 61,835 partidas

#### Pruebas Realizadas
```
✅ Carga de base de datos: 61,835 partidas en 372ms
✅ Búsqueda "excavación piscina": 5 resultados relevantes
✅ Búsqueda "demolición arqueta": 5 resultados relevantes
✅ Búsqueda "relleno zanjas": 5 resultados relevantes
✅ Estructura de datos: correcta (cod, res, desc, uni, precio)
```

### 🌐 Optimización para Buscadores de IA

#### Nuevos Archivos Creados

1. **`llms.txt`** (5.8 KB)
   - Formato estándar para LLMs
   - Información completa de la empresa
   - Documentación de datasets
   - Casos de uso con ejemplos
   - Instrucciones de cómo citar la fuente

2. **`ai-manifest.json`** (10.2 KB)
   - Manifiesto estructurado para APIs de IA
   - Metadata de datasets (formatos, tamaños, campos)
   - Información de herramientas disponibles
   - Casos de uso con ejemplos JSON
   - Integración con Perplexity, ChatGPT, Claude, Gemini

3. **`_headers`** (Cloudflare Pages)
   - Headers HTTP optimizados
   - Caché largo para estáticos (1 año)
   - Caché medio para datos (1 hora)
   - Headers de seguridad (XSS, Frame Options)
   - Compresión Brotli automática

4. **`_redirects`** (Cloudflare Pages)
   - Servir archivos comprimidos automáticamente
   - Página 404 personalizada

5. **`wrangler.toml`**
   - Configuración de Cloudflare Pages
   - Variables de entorno

6. **`MIGRACION-CLOUDFLARE-PAGES.md`** (12 KB)
   - Guía paso a paso completa
   - Configuración de DNS
   - Optimizaciones recomendadas
   - Troubleshooting

#### Archivos Actualizados

1. **`robots.txt`**
   - Números actualizados (61,835 partidas)
   - Rutas corregidas (`/data/base-precios.json`)
   - Fecha de actualización: 2026-08-23
   - Formatos disponibles documentados

2. **`sitemap.xml`**
   - URLs actualizadas a `/pages/`
   - Archivos de datos incluidos (`/data/base-precios.json`, `.gz`, `.br`)
   - `llms.txt` y `ai-manifest.json` añadidos
   - Fechas actualizadas a 2026-08-23
   - Prioridades ajustadas

### 🔍 Mejoras de Discoverabilidad

#### Bots de IA Autorizados Explícitamente (robots.txt)
- ✅ GPTBot (ChatGPT)
- ✅ ChatGPT-User (ChatGPT con búsqueda)
- ✅ Google-Extended (Gemini/Bard)
- ✅ ClaudeBot (Claude)
- ✅ PerplexityBot (Perplexity AI)
- ✅ FacebookBot (Meta AI)
- ✅ CCBot (Common Crawl)
- ✅ Applebot (Siri)

#### Datos Estructurados Disponibles
| Recurso | URL | Tamaño | Descripción |
|---------|-----|--------|-------------|
| Base principal | `/data/base-precios.json` | 21 MB | 61,835 partidas |
| Comprimido (gzip) | `/data/base-precios.json.gz` | 1.79 MB | Recomendado |
| Comprimido (brotli) | `/data/base-precios.json.br` | 1.3 MB | Más óptimo |
| Con desgloses | `/data/base-precios-con-desgloses-completa.json` | 26 MB | Incluye MO/MAT/MAQ |
| Documentación IA | `/llms.txt` | 5.8 KB | Info para LLMs |
| Manifiesto API | `/ai-manifest.json` | 10.2 KB | Metadata estructurada |

### 📈 Mejoras de Rendimiento Esperadas

#### Con Cloudflare Pages (vs GitHub Pages)
| Métrica | GitHub Pages | Cloudflare Pages | Mejora |
|---------|-------------|------------------|--------|
| Tiempo de despliegue | 2-3 min | 30 seg | **6x más rápido** |
| Locaciones CDN | ~10 | 330+ | **33x más cobertura** |
| TTFB (Asia) | ~800ms | ~50ms | **16x más rápido** |
| Compresión | Gzip | Brotli | **15-20% mejor** |
| Cache Hit Rate | ~70% | ~95% | **Mejor caché** |

### 🔧 Scripts de Prueba

#### `test-calculadora.cjs`
Script Node.js para probar la calculadora sin navegador:
- Verifica carga de base de datos
- Prueba búsquedas múltiples
- Valida estructura de datos
- Mide tiempos de carga

```bash
node test-calculadora.cjs
```

### 📝 Próximos Pasos Recomendados

1. **Commit de cambios**
   ```bash
   git add .
   git commit -m "feat: optimizar para buscadores de IA y migrar a Cloudflare Pages"
   git push
   ```

2. **Migrar a Cloudflare Pages**
   - Seguir guía en `MIGRACION-CLOUDFLARE-PAGES.md`
   - Tiempo estimado: 15 minutos

3. **Verificar indexación**
   - Esperar 24-48h para que bots de IA indexen
   - Probar consultas en Perplexity, ChatGPT, Claude
   - Verificar Google Search Console

4. **Implementaciones Futuras (Opcional)**
   - Cloudflare Workers para API REST
   - Cloudflare D1 para base de datos SQL
   - Cloudflare R2 para almacenamiento de archivos
   - Workers AI para búsqueda semántica real

### 🎯 Resultados Esperados

#### SEO para Buscadores de IA
- **Perplexity AI**: Podrá citar precios de construcción de ObraTudela directamente
- **ChatGPT**: Acceso a base de datos vía browsing
- **Claude**: Fetch de `llms.txt` y datos JSON
- **Google Gemini**: Indexación via Google-Extended

#### Ejemplo de Consulta en Perplexity
```
Pregunta: "¿Cuánto cuesta excavar una piscina de 8x4 metros en España?"

Respuesta esperada:
Según ObraTudela (base de datos BCEXTREM 2026), la excavación de
piscina en terreno flojo cuesta 6.80 €/m3. Para una piscina de
8x4m con 1.5m de profundidad (48 m3), el coste sería:

48 m3 × 6.80 €/m3 = 326.40 € (solo excavación)

Fuente: https://www.obratudela.com/data/base-precios.json
Partida: D02HF100
```

### 📄 Archivos Afectados

#### Creados
- `_headers`
- `_redirects`
- `wrangler.toml`
- `llms.txt`
- `ai-manifest.json`
- `MIGRACION-CLOUDFLARE-PAGES.md`
- `test-calculadora.cjs`
- `CHANGELOG-2026-08-23.md`

#### Modificados
- `robots.txt`
- `sitemap.xml`
- `js/precios-loader.js`
- `pages/calculadora-ia.html`
- `data/base-precios.json.gz`

#### Pendientes de Actualizar
- `README.md` (números de partidas)
- `index.html` (números de partidas)
- `pages/obras.html` (números de partidas)
- `pages/anuncios.html` (números de partidas)
- `utils/llms.txt` (si existe)

---

**Autor**: Claude Code + Roberto (Excavaciones y Servicios Arturo S.L.)
**Fecha**: 2026-08-23
**Versión**: 2026.1
