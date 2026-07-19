# 📊 ObraTudela — API para Inteligencias Artificiales

**Acceso público a datos de presupuestos, precios y catálogo de maquinaria**

---

## 🚀 Inicio Rápido

Todas nuestras APIs son públicas, sin autenticación requerida. Perfectas para bots, crawlers e IAs.

```bash
# Buscar anuncios por provincia
curl "https://www.obratudela.com/api/anuncios?provincia=Valladolid"

# Buscar precios de construcción
curl "https://www.obratudela.com/api/precios?q=excavación"

# Listar equipos de alquiler
curl "https://www.obratudela.com/api/catalogo"
```

---

## 📡 Endpoints Disponibles

### 1. **GET /api/anuncios** — Anuncios de Compraventa

Acceso a anuncios de maquinaria, herramientas y materiales en venta.

**Parámetros:**
- `provincia` (string, optional): Filtrar por provincia
  - Valores: Valladolid, Ávila, Burgos, León, Palencia, Salamanca, Segovia, Soria, Zamora
- `categoria` (string, optional): Filtrar por categoría
  - Valores: Maquinaria, Herramientas, Materiales, Vehículos, Electrónica, Otros
- `q` (string, optional): Búsqueda por palabra clave (título/descripción)
- `page` (integer, optional): Número de página (default: 1)

**Ejemplo:**
```bash
curl "https://www.obratudela.com/api/anuncios?provincia=Valladolid&categoria=Maquinaria&page=1"
```

**Respuesta (JSON):**
```json
{
  "ok": true,
  "data": [
    {
      "id": "movtigd4332568",
      "titulo": "Grabadora Láser AtomStack A5 20W",
      "descripcion": "Buen estado, uso doméstico...",
      "precio": 250,
      "categoria": "Electrónica",
      "provincia": "Valladolid",
      "telefono": "607 444 903",
      "emoji": "🏗️",
      "destacado": false,
      "fotos": ["img/anuncios/movtigd4332568/foto1.webp"],
      "fecha": "2026-05-07T18:26:51.085Z"
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

---

### 2. **GET /api/precios** — Base de Precios BCEXTREM 2026

54,777 partidas de obra civil con precios unitarios.

**Parámetros:**
- `q` (string, optional): Búsqueda por nombre de partida (excavación, hormigón, etc.)
- `categoria` (string, optional): Filtrar por tipo de obra
- `page` (integer, optional): Número de página (default: 1, 50 por página)

**Ejemplo:**
```bash
curl "https://www.obratudela.com/api/precios?q=excavación&page=1"
```

**Respuesta (JSON):**
```json
{
  "ok": true,
  "data": [
    {
      "name": "Excavación en terreno medio",
      "description": "Excavación a máquina en terreno medio",
      "category": "Demoliciones y Movimiento de Tierras",
      "unit": "m³",
      "unitPrice": 4.25,
      "laborCost": 2.10,
      "materialCost": 1.95,
      "equipmentCost": 0.20
    }
  ],
  "total": 156,
  "page": 1,
  "pageSize": 50,
  "totalPages": 4,
  "source": "BCEXTREM 2026"
}
```

---

### 3. **GET /api/catalogo** — Catálogo de Maquinaria en Alquiler

71 equipos disponibles por horas/unidades.

**Parámetros:**
- `tipo` (string, optional): Filtrar por tipo (Excavadora, Dozer, Camión, etc.)
- `page` (integer, optional): Número de página (default: 1, 20 por página)

**Ejemplo:**
```bash
curl "https://www.obratudela.com/api/catalogo?tipo=Excavadora"
```

**Respuesta (JSON):**
```json
{
  "ok": true,
  "data": [
    {
      "name": "Excavadora CAT 320",
      "description": "Excavadora de ruedas, 20 toneladas",
      "pricePerHour": 45.00,
      "pricePerDay": 320.00,
      "availability": true,
      "image": "/img/maquinaria/cat320.jpg"
    }
  ],
  "total": 12,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

---

### 4. **GET /api/docs** — Documentación HTML Completa

Página interactiva con ejemplos y detalles de todos los endpoints.

```
https://www.obratudela.com/api/docs
```

---

## 📋 Formatos de Datos Alternativos

### JSON Bruto (Sin Paginación)

Para IAs que prefieren trabajar con archivos completos:

- **Anuncios:** `/anuncios.json`
- **Precios:** `/precios.json` (19 MB, schema.org Dataset)
- **Catálogo:** `/catalogo.json` (schema.org ItemList)

Ejemplo:
```bash
curl "https://www.obratudela.com/catalogo.json" | jq '.itemListElement[0]'
```

---

## 🤖 Uso Desde Diferentes Plataformas

### Claude / ChatGPT / Gemini

Las APIs están configuradas para acceso de bots. No hay restricciones:

```python
import requests
import json

# Buscar presupuestos
response = requests.get(
    "https://www.obratudela.com/api/precios",
    params={"q": "excavación"}
)
data = response.json()
print(f"Encontradas {data['total']} partidas")
```

### Node.js / JavaScript

```javascript
const response = await fetch(
  'https://www.obratudela.com/api/anuncios?provincia=Valladolid'
);
const data = await response.json();
console.log(`${data.total} anuncios encontrados`);
```

### cURL (Bash)

```bash
# Búsqueda con variable
SEARCH="retroexcavadora"
curl -s "https://www.obratudela.com/api/anuncios?q=${SEARCH}" | jq '.data | length'
```

---

## 📊 Metadata Schema.org

Todos nuestros datos incluyen metadata schema.org para máxima interoperabilidad:

```html
<!-- En HTML de anuncios: -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Grabadora Láser...",
  "price": "250",
  "priceCurrency": "EUR"
}
</script>
```

---

## ⚡ Rate Limiting

**No hay límite de tasa** para APIs públicas de lectura (GET).

Para uso en producción con volumen alto, contacta:
- 📧 **Email:** excavacionesart@gmail.com
- 📱 **Teléfono:** 607 444 903

---

## 🔒 Seguridad y Privacidad

- ✅ Todos los datos son **públicos**
- ✅ No hay limitación por User-Agent
- ✅ Compatible con robots.txt estándar
- ✅ CORS habilitado (`Access-Control-Allow-Origin: *`)
- ✅ HTTPS obligatorio en producción

---

## 🐛 Errores y Códigos HTTP

| Código | Significado |
|--------|-------------|
| `200 OK` | Solicitud exitosa |
| `400 Bad Request` | Parámetros inválidos |
| `404 Not Found` | Recurso no encontrado |
| `500 Server Error` | Error interno del servidor |

**Respuesta de error:**
```json
{
  "ok": false,
  "error": "Descripción del error"
}
```

---

## 📈 Historial de Cambios

### v1.0 (2026-07-18)
- ✅ Lanzamiento inicial de APIs públicas
- ✅ Endpoints: `/api/anuncios`, `/api/precios`, `/api/catalogo`
- ✅ Filtros, búsqueda y paginación
- ✅ CORS habilitado globalmente
- ✅ Documentación completa en `/api/docs`

---

## 💡 Casos de Uso Comunes

### 1. **Indexar Presupuestos en Buscador IA**
```bash
# Traer primeros 100 presupuestos
for page in {1..2}; do
  curl -s "https://www.obratudela.com/api/precios?page=$page" | jq '.data[]'
done
```

### 2. **Verificar Disponibilidad de Maquinaria**
```bash
# Monitorear cambios en catálogo cada hora
while true; do
  curl -s "https://www.obratudela.com/api/catalogo" | jq '.total'
  sleep 3600
done
```

### 3. **Integrar en Chatbot**
```python
# Buscar equipos cuando usuario pregunta
if "excavadora" in user_query:
  api_results = fetch("/api/catalogo?tipo=Excavadora")
  response = f"Tenemos {api_results['total']} excavadoras disponibles"
```

---

## 📞 Soporte

**Excavaciones y Servicios Arturo S.L.**
- 🏢 Calle Manzano, 2 — 47320 Tudela de Duero, Valladolid
- 📧 excavacionesart@gmail.com
- 📱 607 444 903
- 🌐 https://www.obratudela.com

---

**API v1.0** | Última actualización: 18 de julio de 2026
