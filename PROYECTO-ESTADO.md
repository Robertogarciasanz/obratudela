# Estado del Proyecto ObraTudela
**Última actualización:** 16 Agosto 2026

## 📊 Resumen Ejecutivo

Proyecto web para **EXCAVACIONES Y SERVICIOS ARTURO S.L.** (www.obratudela.com) con herramientas de presupuestos de construcción.

### Estado Actual
- ✅ **Base de precios:** 59,915 partidas (BCEXTREM + BCCA)
- ✅ **Cobertura descripciones largas:** 98.7% (59,154 partidas)
- ✅ **Herramientas activas:** 3 (Gestor, Calculadora IA, Listado SEO)
- ✅ **Todo subido y funcionando en producción**

---

## 🗂️ Estructura del Proyecto

### Archivos Principales

#### Base de Datos
- **`base-precios.json`** (15.95 MB)
  - 59,915 partidas unificadas
  - Campos: `cod`, `uni`, `res`, `precio`, `desc`
  - 59,154 con descripción larga (98.7%)
  - Fuentes: BCEXTREM (BC3) + BCCA (PDF oficial)

#### Páginas Web
- **`index.html`** - Página principal
- **`gestor-presupuestos.html`** (2.5 MB) - Gestor completo con BC3 embebido
- **`calculadora-ia.html`** - Calculadora con Ollama (IA local)
- **`base-precios-listado.html`** - Listado SEO-friendly para motores de búsqueda
- **`obras.html`** - Galería de obras realizadas
- **`alquileres.html`** - Alquiler de maquinaria
- **`topografia.html`** - Servicios de topografía
- **`anuncios.html`** - Anuncios y ofertas

#### Scripts Python
- **`inyectar-precios-gestor.py`** - Genera DATA_B64 para gestor-presupuestos.html
- **`extraer-desc-pdf-bcca.py`** - Extrae descripciones del PDF oficial BCCA
- **`convert-bc3-to-json.py`** - Convierte BC3 a JSON
- **`combinar-bases-precios.py`** - Unifica BCEXTREM + BCCA

#### Archivos de Datos
- **`bcca-andalucia.json`** - Base BCCA original
- **`bcca-precios-unitarios.pdf`** (7.2 MB) - PDF oficial Junta de Andalucía
- **`capitulos-map.json`** - Mapeo de capítulos por oficio

#### Configuración
- **`sitemap.xml`** - Mapa del sitio para SEO
- **`robots.txt`** - Configuración para crawlers
- **`llms.txt`** - Información para IAs
- **`CNAME`** - Dominio personalizado

---

## 🔧 Herramientas del Proyecto

### 1. Gestor de Presupuestos (`gestor-presupuestos.html`)
**URL:** https://www.obratudela.com/gestor-presupuestos.html

**Características:**
- 59,915 partidas embebidas (DATA_B64 comprimido con pako.js)
- Organización por 14 categorías (Demolición, Instalaciones, etc.)
- Búsqueda en tiempo real
- Botón A/A+ para alternar descripción corta/larga
- Exportación a PDF con logo de empresa
- Carga de archivos BC3 externos
- IVA automático (21%)
- Impresión profesional

**Tamaño:** 2.5 MB (DATA_B64: 1.87 MB comprimido)

**Cómo actualizar:**
```bash
python inyectar-precios-gestor.py
git add gestor-presupuestos.html
git commit -m "Actualizar gestor con nuevos precios"
git push
```

---

### 2. Calculadora IA (`calculadora-ia.html`)
**URL:** https://www.obratudela.com/calculadora-ia.html

**Características:**
- **Motor de búsqueda local/heurístico** (NO usa Ollama)
- Búsqueda por palabras clave con stopwords en español
- Algoritmo de scoring por relevancia
- Carga base-precios.json (59,915 partidas)
- Fallback con 46 partidas embebidas (modo offline)
- Selección múltiple de partidas con confirmación manual
- Exportación a PDF con logo

**Cómo funciona:**
1. Usuario escribe descripción del trabajo
2. Función `buscarPartidas()` busca palabras clave en base-precios.json
3. Ordena resultados por relevancia (score)
4. Muestra hasta 5 opciones al usuario
5. Usuario selecciona manualmente las partidas que desea
6. Añade al presupuesto con cantidad editable

**Nota importante:** A pesar del nombre "calculadora-ia", **NO hace llamadas a servicios LLM externos**. Es un buscador local por palabras clave.

---

### 3. Listado SEO (`base-precios-listado.html`)
**URL:** https://www.obratudela.com/base-precios-listado.html

**Características:**
- Página HTML indexable por Google, Bing, etc.
- Meta tags SEO optimizados
- Buscador en tiempo real
- Muestra código, unidad, precio y descripción completa
- Responsive design
- Prioridad 0.9 en sitemap.xml

**Objetivo:** Hacer las partidas accesibles para:
- Motores de búsqueda (Google, Bing)
- IAs (ChatGPT, Claude, Gemini)
- Usuarios sin herramientas especializadas

---

## 📈 Historial de Cambios Importantes

### 16 Agosto 2026 - Cobertura 98.7%
**Commit:** `bd0595d` y `71883e8`

**Cambios:**
1. Extraídas 5,856 descripciones del PDF oficial BCCA
2. Actualizadas 5,811 partidas BCCA sin descripción
3. Cobertura subió de 89% a 98.7%
4. Creada página `base-precios-listado.html` para SEO
5. Actualizado sitemap.xml

**Scripts creados:**
- `extraer-desc-pdf-bcca.py` - Extrae descripciones del PDF con regex

**Antes:**
- 53,409 partidas con descripción (89%)
- 6,506 sin descripción (11%)

**Después:**
- 59,154 partidas con descripción (98.7%)
- 761 sin descripción (1.3%)

---

### Agosto 2026 - Unificación y Limpieza
**Commits anteriores**

**Cambios:**
1. Unificación BCEXTREM + BCCA en `base-precios.json`
2. Eliminación de prefijos "BCCA_" de códigos
3. Limpieza de códigos de descomposición en campo `desc`
4. Creación de `capitulos-map.json`
5. Documentación en `ESTRUCTURA-CAPITULOS.md`

**Archivos eliminados:**
- `precios.json` (duplicado, 53,403 partidas)
- `precios.min.json` (duplicado)
- `precios-combinado.json` (renombrado a base-precios.json)
- Scripts de prueba obsoletos

---

## 🌐 URLs del Proyecto

### Producción
- **Sitio principal:** https://www.obratudela.com
- **Gestor:** https://www.obratudela.com/gestor-presupuestos.html
- **Calculadora IA:** https://www.obratudela.com/calculadora-ia.html
- **Listado SEO:** https://www.obratudela.com/base-precios-listado.html
- **API JSON:** https://www.obratudela.com/base-precios.json

### Desarrollo Local
- **Servidor Python:** `python -m http.server 8000`
- **URL local:** http://localhost:8000

---

## 🔑 Datos Importantes

### Empresa
- **Nombre:** EXCAVACIONES Y SERVICIOS ARTURO S.L.
- **NIF:** B47489612
- **Email:** excavacionesart@gmail.com
- **Teléfono:** 680 42 17 65

### Git
- **Repositorio:** https://github.com/Robertogarciasanz/obratudela.git
- **Rama principal:** `main`
- **GitHub Pages:** Activo

### Base de Precios
- **Total partidas:** 59,915
- **BCEXTREM:** ~22,859 (con textos largos en BC3)
- **BCCA:** ~37,056 (con textos largos en PDF oficial)
- **Con descripción larga:** 59,154 (98.7%)
- **Sin descripción:** 761 (1.3% - auxiliares)

---

## 🛠️ Comandos Útiles

### Actualizar Gestor de Presupuestos
```bash
# 1. Editar base-precios.json si es necesario
# 2. Regenerar gestor
python inyectar-precios-gestor.py

# 3. Subir cambios
git add base-precios.json gestor-presupuestos.html
git commit -m "Actualizar base de precios"
git push
```

### Probar Calculadora IA Localmente
```bash
# Iniciar servidor local
python -m http.server 8000

# Abrir en navegador
start http://localhost:8000/calculadora-ia.html

# La calculadora funciona sin dependencias externas
# Busca en base-precios.json con algoritmo local
```

### Servidor Local de Desarrollo
```bash
# Python 3
python -m http.server 8000

# Abrir navegador
start http://localhost:8000
```

### Git - Subir Cambios
```bash
git status
git add .
git commit -m "Descripción del cambio"
git push
```

---

## 📝 Notas Técnicas

### Formato BC3 (FIEBDC-3)
- **~V:** Versión y metadatos
- **~C:** Concepto/partida (código, unidad, resumen, precio)
- **~D:** Descomposición (componentes con rendimientos)
- **~T:** Texto largo (descripción detallada)
- **~K:** Capítulo/jerarquía

### Estructura de base-precios.json
```json
{
  "cod": "01ALM90003",
  "uni": "m3",
  "res": "DEMOLICIÓN SELECTIVA M. MANUALES DE MURO DE L/M",
  "precio": 91.34,
  "desc": "Demolición de muro de ladrillo macizo con medios manuales..."
}
```

### Códigos de Partidas
- **BCEXTREM:** Letras + números (ej: `E03IIP010`, `U14C013`)
- **BCCA:** 2 dígitos + 3 letras + 5 dígitos (ej: `01ALM90003`)

### Categorías del Gestor
1. A0 - Auxiliares
2. C0 - Control de calidad
3. E1 - Edificación/Estructura
4. JARDINERIA
5. CARGA (Residuos/Vertedero)
6. AISLAMIENTO
7. N0 - Varios
8. MAQUINARIA
9. MANO DE OBRA
10. MATERIALES
11. DEMOLICION
12. R0 - Revestimientos
13. SEGURIDAD
14. U0 - Urbanización

### Flujo de la Calculadora IA (calculadora-ia.html)

**1. Carga inicial:**
```javascript
// Intenta cargar base-precios.json
const response = await fetch('base-precios.json');
preciosDB = await response.json();
// Mensaje: "✅ Base de datos cargada: 59,915 partidas"

// Si falla (404, CORS, timeout):
preciosDB = PARTIDAS_FALLBACK; // 46 partidas embebidas
// Mensaje: "⚠️ Modo offline: 46 partidas disponibles"
```

**2. Búsqueda (función buscarPartidas):**
- Extrae palabras clave (ignora stopwords: de, la, el, etc.)
- Busca en `cod`, `res` y `desc` de cada partida
- Calcula score por relevancia (palabras largas > 5 letras = 2 puntos)
- Bonus si coincide con código (+3 puntos)
- Devuelve top 10 resultados ordenados

**3. Selección manual:**
- Usuario ve hasta 5 opciones
- Click para seleccionar/deseleccionar (togglePartida)
- Botón "Añadir X partidas seleccionadas"
- NO hay autocompletado ni sugerencias automáticas

**4. Panel de presupuesto:**
- Partidas se añaden con cantidad editable
- Botón para eliminar partidas
- Opción de añadir partidas manualmente (código o custom)
- Cálculo automático de subtotal + IVA 21%
- Exportación a PDF con logo de empresa

**Importante:** El nombre "IA" es histórico/marketing. **No hay machine learning ni LLM**. Es un buscador heurístico por palabras clave.

---

## ⚠️ Problemas Conocidos y Soluciones

### Problema: Caché del navegador
**Síntoma:** Cambios no se ven en el sitio web
**Solución:** Ctrl + F5 o modo incógnito

### Problema: Calculadora IA no carga partidas completas
**Síntoma:** Solo muestra 46 partidas (modo offline) en lugar de 59,915

**⚠️ PROBLEMA CONOCIDO:** base-precios.json pesa **19 MB** (18,893,401 bytes)
- Tiempo de descarga: ~2-10 segundos (según conexión)
- Puede fallar en conexiones lentas o móviles
- GitHub Pages tiene límite de timeout

**Causas posibles:**
1. **Archivo muy grande** (19 MB tarda en descargar)
2. **Timeout del fetch** (navegador cancela la descarga)
3. **Restricciones de memoria** del navegador móvil
4. **Conexión lenta** del usuario

**Solución:**
```bash
# 1. Verificar que el archivo existe
curl -I https://www.obratudela.com/base-precios.json

# 2. Comprobar tamaño y tiempo de respuesta
curl -w "@-" -o /dev/null -s https://www.obratudela.com/base-precios.json <<'EOF'
    time_total:  %{time_total}\n
    size_download:  %{size_download}\n
EOF

# 3. Revisar consola del navegador (F12 → Console)
# Buscar errores de fetch o CORS

# 4. Verificar en Network (F12 → Network)
# Ver si base-precios.json se descarga completamente
```

**Indicadores de éxito:**
- ✅ Mensaje: "Base de datos cargada: 59.915 partidas disponibles"
- ⚠️ Fallback: "Modo offline: 46 partidas disponibles" (fetch falló)

**Soluciones futuras (recomendadas):**

**Opción 1: Comprimir con gzip** (más simple)
```bash
# Crear versión comprimida
gzip -c base-precios.json > base-precios.json.gz  # ~2-3 MB

# Modificar calculadora-ia.html para:
# - Intentar fetch('base-precios.json.gz')
# - Descomprimir con pako.js (ya está incluido en gestor)
# - Si falla, usar fallback de 46 partidas
```

**Opción 2: Versión reducida sin descripciones largas** (rápida)
```bash
# Crear versión light (solo cod, uni, res, precio)
node -e "const d=require('./base-precios.json'); \
  const light=d.map(p=>({cod:p.cod,uni:p.uni,res:p.res,precio:p.precio})); \
  require('fs').writeFileSync('base-precios-light.json', JSON.stringify(light));"

# Resultado: ~5-6 MB (3x más pequeño)
# Usar en calculadora-ia.html por defecto
```

**Opción 3: Carga progresiva** (óptima pero compleja)
```javascript
// Cargar primero partidas más usadas (~1000)
fetch('base-precios-top1000.json')  // ~1 MB
  .then(() => {
    // Cargar resto en segundo plano
    fetch('base-precios-resto.json')  // ~18 MB
  });
```

**Recomendación:** Usar **Opción 1 (gzip)** por:
- ✅ Reduce tamaño a ~2-3 MB (85% menos)
- ✅ Mantiene todas las descripciones largas
- ✅ pako.js ya está en el proyecto (gestor lo usa)
- ✅ Cambio mínimo en calculadora-ia.html

---

## 🚀 Mejoras Técnicas Recomendadas (Pendientes)

### 1. Comprimir base-precios.json con Content-Encoding
**Problema:** 19 MB sin comprimir
**Solución:** Configurar servidor para servir con gzip/Brotli automáticamente

```bash
# GitHub Pages automáticamente sirve con gzip si el archivo es .json
# Verificar headers de respuesta:
curl -I https://www.obratudela.com/base-precios.json | grep "Content-Encoding"

# Si no hay compresión automática, crear .gz manualmente:
gzip -k -9 base-precios.json  # Crea base-precios.json.gz (~2-3 MB)

# Modificar calculadora-ia.html para intentar:
# 1. fetch('base-precios.json.gz') + descomprimir con pako
# 2. Si falla, fetch('base-precios.json')
# 3. Si falla, usar fallback (46 partidas)
```

**Beneficio:** Reduce transferencia a ~2-3 MB sin cambiar el archivo original

---

### 2. Crear precios-busqueda.json (versión compacta)
**Problema:** Calculadora solo necesita `cod`, `uni`, `res`, `precio` para búsqueda
**Solución:** Versión ligera sin descripciones largas

```bash
# Generar versión compacta
node -e "
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync('base-precios.json', 'utf8'));
  const compact = data.map(p => ({
    cod: p.cod,
    uni: p.uni,
    res: p.res,
    precio: p.precio
    // desc se omite → reduce ~70% del tamaño
  }));
  fs.writeFileSync('precios-busqueda.json', JSON.stringify(compact));
"

# Resultado: ~5-6 MB (3x más pequeño)
```

**Modificar calculadora-ia.html:**
```javascript
// Cargar versión compacta para búsqueda
const response = await fetch('precios-busqueda.json');
preciosDB = await response.json();

// Descripción larga se puede cargar bajo demanda:
// - Al seleccionar partida
// - O desde gestor-presupuestos.html (ya tiene todo)
```

**Beneficio:**
- ✅ Carga 3x más rápida
- ✅ Búsqueda igual de efectiva
- ✅ Descripciones largas disponibles en gestor

---

### 3. Índice invertido para búsquedas (óptimo)
**Problema:** buscarPartidas() itera 59,915 partidas en cada búsqueda
**Solución:** Pre-calcular índice invertido (palabra → códigos)

```javascript
// Ejemplo de índice invertido
const searchIndex = {
  "demolicion": ["01ALM90003", "01AAB00001", ...],
  "muro": ["01ALM90003", "01ADS00001", ...],
  "ladrillo": ["01ALM90003", "01ADS00002", ...],
  // ...
};

// Búsqueda optimizada
function buscarPartidas(descripcion) {
  const keywords = extraerPalabras(descripcion);
  const codigosSet = new Set();

  // Buscar en índice (O(1) por palabra)
  keywords.forEach(kw => {
    (searchIndex[kw] || []).forEach(cod => codigosSet.add(cod));
  });

  // Devolver partidas completas
  return Array.from(codigosSet).map(cod =>
    preciosDB.find(p => p.cod === cod)
  );
}
```

**Script para generar índice:**
```bash
node generar-indice-busqueda.js
# Output: search-index.json (~500 KB)
```

**Beneficio:**
- ✅ Búsqueda instantánea (no itera todo el array)
- ✅ Índice compacto (~500 KB)
- ✅ Puede combinarse con precios-busqueda.json

---

### 4. Carga por chunks/paginada (avanzado)
**Problema:** 19 MB se descarga todo de una vez
**Solución:** Cargar progresivamente

**Opción A: Múltiples archivos**
```bash
# Dividir en chunks
node split-precios.js
# Output:
# - precios-chunk-1.json (0-10,000)    ~3 MB
# - precios-chunk-2.json (10,000-20,000) ~3 MB
# - precios-chunk-3.json (20,000-30,000) ~3 MB
# ...
```

**Opción B: API endpoint (requiere backend)**
```javascript
// Endpoint paginado
GET /api/precios?start=0&limit=5000

// Calculadora carga bajo demanda
async function cargarMasPartidas(start) {
  const response = await fetch(`/api/precios?start=${start}&limit=5000`);
  const partidas = await response.json();
  preciosDB.push(...partidas);
}
```

**Beneficio:**
- ✅ Carga inicial rápida
- ✅ Resto se carga en segundo plano
- ⚠️ Requiere infraestructura backend

---

### 5. Service Worker + Caché (PWA)
**Solución más robusta:**
```javascript
// service-worker.js
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('precios-v1').then(cache => {
      return cache.addAll([
        '/base-precios.json',
        '/calculadora-ia.html'
      ]);
    })
  );
});

// Primera carga: descarga 19 MB
// Siguientes: desde caché local (instantáneo)
```

**Beneficio:**
- ✅ Primera carga lenta, resto instantáneo
- ✅ Funciona offline
- ✅ Se actualiza en segundo plano

---

## 📝 Priorización de Mejoras

**Corto plazo (1 sesión):**
1. ✅ **Crear precios-busqueda.json** (5-6 MB, sin desc)
2. ✅ **Modificar calculadora-ia.html** para usar versión compacta
3. ✅ **Subir ambos archivos** al servidor

**Medio plazo (2-3 sesiones):**
4. ⬜ Generar índice invertido search-index.json
5. ⬜ Optimizar búsqueda con índice
6. ⬜ Comprimir con gzip automático

**Largo plazo (futuro):**
7. ⬜ Service Worker + PWA
8. ⬜ Backend con API paginada
9. ⬜ Carga por chunks progresiva

---

## 🎯 Próxima Sesión: Plan Sugerido

**Objetivo:** Reducir tiempo de carga de calculadora-ia.html

**Pasos:**
```bash
# 1. Crear versión compacta
node -e "const d=require('./base-precios.json'); \
  fs.writeFileSync('precios-busqueda.json', \
  JSON.stringify(d.map(p=>({cod:p.cod,uni:p.uni,res:p.res,precio:p.precio}))));"

# 2. Verificar tamaño
ls -lh precios-busqueda.json  # Debería ser ~5-6 MB

# 3. Modificar calculadora-ia.html línea ~620
# Cambiar: fetch('base-precios.json')
# Por:     fetch('precios-busqueda.json')

# 4. Probar localmente
python -m http.server 8000
# Abrir http://localhost:8000/calculadora-ia.html
# Verificar: "Base de datos cargada: 59,915 partidas"

# 5. Subir
git add precios-busqueda.json calculadora-ia.html
git commit -m "Optimizar calculadora-ia: usar precios-busqueda.json (6 MB)"
git push
```

**Tiempo estimado:** 15-20 minutos
**Mejora esperada:** Carga 3x más rápida (2-3 seg vs 6-10 seg)

### Problema: Errores de encoding en Python
**Síntoma:** `UnicodeEncodeError` con emojis
**Solución:** Evitar emojis en prints o usar `errors='replace'`

### Problema: Archivo BC3 no se carga
**Síntoma:** "Error BC3" en gestor
**Solución:** Verificar encoding (latin-1 o cp1252)

---

## 🎯 Próximas Mejoras (Opcionales)

### Corto Plazo
- [ ] Agregar más imágenes a galería de obras
- [ ] Actualizar precios con BCEXTREM 2027 cuando esté disponible
- [ ] Mejorar prompt de Ollama para mejores resultados

### Medio Plazo
- [ ] Integrar desgloses (MO/MAT/MAQ) en calculadora IA
- [ ] Sistema de usuarios para guardar presupuestos
- [ ] Exportación a Excel

### Largo Plazo
- [ ] App móvil nativa
- [ ] Integración con software de contabilidad
- [ ] API REST para terceros

---

## 📚 Documentación Relacionada

### Archivos del Proyecto
- `ESTRUCTURA-CAPITULOS.md` - Estructura de capítulos por oficio
- `README.md` - Documentación general del proyecto
- `llms.txt` - Información para IAs

### Enlaces Externos
- [BCEXTREM Oficial](http://preciosextremadura.gobex.es/)
- [BCCA Junta de Andalucía](https://www.juntadeandalucia.es/organismos/fomentoarticulaciondelterritorioyvivienda/areas/vivienda-rehabilitacion/planes-instrumentos/paginas/vivienda-bcca.html)
- [Ollama](https://ollama.com/)
- [Formato FIEBDC-3](http://www.fiebdc.es/)

---

## 👤 Información de Contacto

**Desarrollador:** Claude Code (Anthropic)
**Cliente:** Roberto García Sanz
**Empresa:** EXCAVACIONES Y SERVICIOS ARTURO S.L.
**Última sesión:** 16 Agosto 2026

---

## 🔄 Cómo Usar Este Archivo

**Para la próxima sesión:**
1. Abre este archivo (`PROYECTO-ESTADO.md`)
2. Revisa el estado actual del proyecto
3. Consulta comandos útiles según lo que necesites
4. Actualiza este archivo si haces cambios importantes

**Ejemplo de uso:**
```bash
# Ver este archivo
cat PROYECTO-ESTADO.md

# O abrirlo en editor
code PROYECTO-ESTADO.md
```

---

**Fin del documento** 📄
