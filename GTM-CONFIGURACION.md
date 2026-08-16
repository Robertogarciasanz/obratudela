# Configuración de Google Tag Manager

Este documento describe la configuración de eventos personalizados en GTM para la Calculadora de Presupuestos IA.

## ID de Contenedor
**GTM-T26SL49M**

## Eventos Personalizados Implementados

### 1. `precios_loaded` - Carga de Base de Datos
**Cuándo se dispara:** Al cargar exitosamente la base de datos de precios

**Variables del evento:**
- `num_partidas` (Number) - Número de partidas cargadas
- `source` (String) - Fuente de carga: `cache`, `network`, `fallback`
- `load_time_ms` (Number) - Tiempo de carga en milisegundos

**Uso en GTM:**
- Crear métricas de rendimiento de carga
- Detectar cuántos usuarios cargan desde caché vs red
- Identificar usuarios en modo offline (fallback)

---

### 2. `search` - Búsqueda de Partidas
**Cuándo se dispara:** Cuando el usuario realiza una búsqueda

**Variables del evento:**
- `search_term` (String) - Texto de búsqueda del usuario
- `num_results` (Number) - Número de resultados encontrados

**Uso en GTM:**
- Analizar términos de búsqueda más comunes
- Identificar búsquedas sin resultados (num_results = 0)
- Optimizar base de datos según búsquedas populares

---

### 3. `partida_agregada` - Partida Agregada
**Cuándo se dispara:** Al agregar una partida al presupuesto

**Variables del evento:**
- `codigo` (String) - Código de la partida (ej: D02AA100)
- `descripcion` (String) - Descripción de la partida
- `precio` (Number) - Precio unitario
- `cantidad` (Number) - Cantidad agregada
- `total` (Number) - Precio × Cantidad

**Uso en GTM:**
- Identificar partidas más utilizadas
- Calcular valor promedio de partidas
- Crear audiencias por tipo de trabajo

---

### 4. `partidas_agregadas_bulk` - Múltiples Partidas
**Cuándo se dispara:** Al confirmar selección de múltiples partidas

**Variables del evento:**
- `num_partidas` (Number) - Número de partidas agregadas simultáneamente

**Uso en GTM:**
- Medir eficiencia de selección múltiple
- Detectar patrones de uso

---

### 5. `partida_eliminada` - Partida Eliminada
**Cuándo se dispara:** Al eliminar una partida del presupuesto

**Variables del evento:**
- `codigo` (String) - Código de la partida eliminada

**Uso en GTM:**
- Detectar partidas que se agregan y eliminan frecuentemente
- Identificar errores de selección

---

### 6. `cantidad_actualizada` - Cambio de Cantidad
**Cuándo se dispara:** Al modificar la cantidad de una partida

**Variables del evento:**
- `codigo` (String) - Código de la partida
- `cantidad_anterior` (Number) - Cantidad anterior
- `cantidad_nueva` (Number) - Nueva cantidad

**Uso en GTM:**
- Analizar ajustes de cantidades
- Detectar patrones de modificación

---

### 7. `presupuesto_exportado` - Exportación
**Cuándo se dispara:** Al exportar/imprimir el presupuesto

**Variables del evento:**
- `num_partidas` (Number) - Número de partidas en el presupuesto
- `subtotal` (Number) - Subtotal sin IVA
- `total` (Number) - Total con IVA (21%)
- `iva` (Number) - Importe del IVA

**Uso en GTM:**
- Medir conversiones (exportación = lead)
- Calcular valor promedio de presupuestos
- Segmentar por rangos de valor

---

### 8. `partida_manual_agregada` - Partida Manual
**Cuándo se dispara:** Al agregar partida por código o personalizada

**Variables del evento:**
- `codigo` (String) - Código de la partida
- `es_personalizada` (Boolean) - true si es partida personalizada

**Uso en GTM:**
- Identificar usuarios avanzados (usan códigos)
- Detectar partidas faltantes en BD

---

### 9. `partidas_seleccionadas` - Selección de Partidas
**Cuándo se dispara:** Al seleccionar/deseleccionar partidas antes de confirmar

**Variables del evento:**
- `grupo_id` (Number) - ID del grupo de búsqueda
- `num_seleccionadas` (Number) - Número de partidas seleccionadas

**Uso en GTM:**
- Medir engagement con opciones de búsqueda
- Detectar abandono antes de confirmar

---

### 10. `app_error` - Errores
**Cuándo se dispara:** Cuando ocurre un error en la aplicación

**Variables del evento:**
- `error_type` (String) - Tipo de error
- `error_message` (String) - Mensaje de error

**Uso en GTM:**
- Monitoreo de errores
- Alertas de problemas técnicos

---

## Configuración Recomendada en GTM

### Tags (Etiquetas) a Crear

#### 1. GA4 - Evento de Carga de Precios
- **Tipo:** Google Analytics: Evento GA4
- **Nombre del evento:** `precios_loaded`
- **Activador:** Evento personalizado `precios_loaded`
- **Parámetros del evento:**
  - `num_partidas` → `{{num_partidas}}`
  - `source` → `{{source}}`
  - `load_time` → `{{load_time_ms}}`

#### 2. GA4 - Evento de Búsqueda
- **Tipo:** Google Analytics: Evento GA4
- **Nombre del evento:** `search`
- **Activador:** Evento personalizado `search`
- **Parámetros del evento:**
  - `search_term` → `{{search_term}}`
  - `num_results` → `{{num_results}}`

#### 3. GA4 - Evento de Conversión (Exportación)
- **Tipo:** Google Analytics: Evento GA4
- **Nombre del evento:** `generate_lead`
- **Activador:** Evento personalizado `presupuesto_exportado`
- **Parámetros del evento:**
  - `value` → `{{total}}`
  - `currency` → `EUR`
  - `num_items` → `{{num_partidas}}`
- **Marcar como conversión en GA4**

### Variables a Crear

Para cada parámetro de evento, crear una variable de tipo "Variable de capa de datos":

- `num_partidas` → `num_partidas`
- `source` → `source`
- `load_time_ms` → `load_time_ms`
- `search_term` → `search_term`
- `num_results` → `num_results`
- `codigo` → `codigo`
- `descripcion` → `descripcion`
- `precio` → `precio`
- `cantidad` → `cantidad`
- `total` → `total`
- `subtotal` → `subtotal`
- `iva` → `iva`
- `es_personalizada` → `es_personalizada`

### Activadores a Crear

Crear un activador de "Evento personalizado" para cada evento:

- Activador: Evento personalizado → `precios_loaded`
- Activador: Evento personalizado → `search`
- Activador: Evento personalizado → `partida_agregada`
- Activador: Evento personalizado → `presupuesto_exportado`
- etc.

---

## Métricas Clave a Monitorear

### Rendimiento
- **Tiempo de carga promedio** (`load_time_ms`)
- **% de usuarios con caché** (source = cache)
- **% de usuarios en modo offline** (source = fallback)

### Engagement
- **Búsquedas por sesión**
- **Partidas agregadas por sesión**
- **% de búsquedas sin resultados** (num_results = 0)

### Conversión
- **Tasa de exportación** (sesiones con `presupuesto_exportado` / total sesiones)
- **Valor promedio de presupuesto** (avg total)
- **Partidas promedio por presupuesto** (avg num_partidas)

### Producto
- **Partidas más buscadas** (agrupación por `search_term`)
- **Partidas más agregadas** (agrupación por `codigo`)
- **Términos de búsqueda sin resultados** (oportunidades de mejora)

---

## Ejemplo de Implementación

```javascript
// Todos los eventos se envían automáticamente desde analytics.js
// Ejemplo de cómo aparecen en dataLayer:

window.dataLayer = [
  {
    event: 'search',
    search_term: 'excavación piscina',
    num_results: 15
  },
  {
    event: 'partida_agregada',
    codigo: 'D02HF100',
    descripcion: 'Excavación de piscina en terreno flojo',
    precio: 6.80,
    cantidad: 24,
    total: 163.20
  },
  {
    event: 'presupuesto_exportado',
    num_partidas: 8,
    subtotal: 1250.00,
    total: 1512.50,
    iva: 262.50
  }
]
```

---

## Verificación

Para verificar que los eventos se están enviando correctamente:

1. Abrir la consola del navegador (F12)
2. Los eventos aparecen con el prefijo `📊 Analytics:`
3. Usar GTM Preview Mode para ver eventos en tiempo real
4. Verificar en GA4 Realtime que los eventos llegan correctamente

---

## Próximos Pasos

1. ✅ Implementación del código (completada)
2. ⏳ Crear tags, variables y activadores en GTM
3. ⏳ Configurar conversiones en GA4
4. ⏳ Crear dashboards personalizados
5. ⏳ Configurar alertas de errores
