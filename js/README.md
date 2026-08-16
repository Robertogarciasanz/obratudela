# Módulos JavaScript - Calculadora IA

Esta carpeta contiene los módulos ES6 de la aplicación de calculadora de presupuestos con IA.

## Estructura de Módulos

### 📦 `precios-loader.js`
Gestión de carga de datos con caché y fallback.

**Exporta:**
- `loadPrecios(onMessage)` - Carga la base de datos de precios con fallback inteligente
- `PARTIDAS_FALLBACK` - Array de partidas embebidas para modo offline

**Características:**
- Sistema de caché versionado en sessionStorage (7 días)
- Fallback multinivel: .gz → .json → partidas embebidas
- Descompresión automática con pako para archivos .gz
- Invalidación de caché por versión

---

### 🔍 `search.js`
Lógica de búsqueda heurística de partidas.

**Exporta:**
- `buscarPartidas(descripcion, preciosDB, maxResults)` - Busca partidas relevantes

**Características:**
- Filtrado de stopwords en español
- Scoring basado en coincidencias de palabras clave
- Bonus para palabras largas (más específicas)
- Bonus adicional para coincidencias en códigos

---

### 📋 `presupuesto.js`
Gestión del presupuesto y cálculos.

**Exporta:**
- `getPresupuesto()` - Obtiene el presupuesto actual
- `agregarPartida(partida)` - Agrega una partida
- `agregarPartidas(partidas)` - Agrega múltiples partidas
- `actualizarCantidad(index, cantidad)` - Actualiza cantidad de partida
- `eliminarPartida(index)` - Elimina una partida
- `calcularTotales()` - Calcula subtotal, IVA y total
- `limpiarPresupuesto()` - Limpia el presupuesto
- `generarHTMLExportacion()` - Genera HTML para imprimir
- `exportarPresupuesto()` - Abre ventana de impresión

---

### 🎨 `ui.js`
Gestión de la interfaz de usuario.

**Exporta:**
- `addMessage(type, text)` - Agrega mensaje al chat
- `addHTMLMessage(html)` - Agrega HTML personalizado al chat
- `renderPresupuesto(callbacks)` - Renderiza el presupuesto
- `renderOpcionesPartidas(partidas, total, grupoId, callbacks)` - Renderiza opciones de búsqueda
- `updateConfirmButton(grupoId, numPartidas)` - Actualiza botón de confirmación
- `deshabilitarBotonConfirmacion(grupoId)` - Deshabilita botón tras confirmar
- `setEnviarButtonEnabled(enabled)` - Habilita/deshabilita botón enviar
- `getUserInputAndClear()` - Obtiene y limpia input del usuario
- `focusUserInput()` - Enfoca el input

**Nota:** Usa handlers globales (`window.*Handler`) para eventos desde HTML inline.

---

### ⚙️ `main.js`
Módulo principal que coordina toda la aplicación.

**Responsabilidades:**
- Inicialización de la aplicación
- Coordinación entre módulos
- Gestión del flujo de búsqueda y selección
- Handlers de eventos del usuario
- Gestión del estado global (partidasSeleccionadas, isProcessing)

**Funciones principales:**
- `init()` - Inicializa la aplicación
- `sendMessage()` - Envía mensaje del usuario
- `generarPresupuestoIA(descripcion)` - Procesa búsqueda con IA local
- `togglePartida(elemento, codigo, grupoId)` - Selecciona/deselecciona partida
- `confirmarSeleccion(grupoId)` - Confirma partidas seleccionadas
- `agregarPartidaManual()` - Agrega partida por código

---

### 📊 `analytics.js`
Módulo de tracking con Google Tag Manager.

**Exporta:**
- `trackPreciosLoaded(numPartidas, source, loadTime)` - Track carga de BD
- `trackSearch(query, numResultados)` - Track búsquedas
- `trackPartidaAgregada(codigo, descripcion, precio, cantidad)` - Track agregar partida
- `trackPartidasAgregadas(numPartidas)` - Track agregar múltiples partidas
- `trackPartidaEliminada(codigo)` - Track eliminar partida
- `trackCantidadActualizada(codigo, anterior, nueva)` - Track cambio cantidad
- `trackPresupuestoExportado(numPartidas, subtotal, total)` - Track exportación
- `trackPartidaManual(codigo, esPersonalizada)` - Track partida manual
- `trackSeleccionPartidas(grupoId, numSeleccionadas)` - Track selección
- `trackError(errorType, message)` - Track errores

**Eventos enviados a GTM:**
- `precios_loaded` - Base de datos cargada
- `search` - Usuario realiza búsqueda
- `partida_agregada` - Partida agregada al presupuesto
- `partidas_agregadas_bulk` - Múltiples partidas agregadas
- `partida_eliminada` - Partida eliminada
- `cantidad_actualizada` - Cantidad modificada
- `presupuesto_exportado` - Presupuesto exportado/impreso
- `partida_manual_agregada` - Partida agregada por código
- `partidas_seleccionadas` - Selección de partidas
- `app_error` - Error en la aplicación

---

## Flujo de Datos

```
Usuario escribe → main.js (sendMessage)
                     ↓
                  search.js (buscarPartidas) → analytics.js (trackSearch)
                     ↓
                  ui.js (renderOpcionesPartidas)
                     ↓
              Usuario selecciona partidas → analytics.js (trackSeleccionPartidas)
                     ↓
                  main.js (confirmarSeleccion)
                     ↓
             presupuesto.js (agregarPartidas) → analytics.js (trackPartidaAgregada)
                     ↓
                  ui.js (renderPresupuesto)
```

**Nota:** Todos los eventos importantes envían métricas a GTM vía `analytics.js`

## Beneficios de la Modularización

✅ **Mantenibilidad**: Código organizado por responsabilidades
✅ **Testabilidad**: Cada módulo puede probarse independientemente
✅ **Reutilización**: Funciones exportables en otros contextos
✅ **Optimización**: Posibilidad de lazy-loading de módulos
✅ **Legibilidad**: Archivos más pequeños y enfocados
✅ **Versionado**: Cambios más fáciles de rastrear en Git

## Futuras Optimizaciones Posibles

- **Code splitting**: Cargar módulos bajo demanda
- **Service Worker**: Cache de módulos para PWA
- **Tree shaking**: Eliminar código no usado en build
- **Minificación**: Comprimir módulos en producción
- **Índice invertido**: Optimizar búsquedas con estructura de datos especializada
- **Web Workers**: Búsqueda en background thread
