/**
 * Módulo de Analytics para Google Tag Manager
 * Proporciona funciones para tracking de eventos personalizados
 */

/**
 * Envía un evento a GTM dataLayer
 * @param {string} event - Nombre del evento
 * @param {Object} params - Parámetros adicionales del evento
 */
function pushEvent(event, params = {}) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: event,
      ...params
    });
    console.log(`📊 Analytics: ${event}`, params);
  }
}

/**
 * Track cuando se carga la base de datos de precios
 * @param {number} numPartidas - Número de partidas cargadas
 * @param {string} source - Fuente de carga (cache, network-gz, network-json, fallback)
 * @param {number} loadTime - Tiempo de carga en ms
 */
export function trackPreciosLoaded(numPartidas, source, loadTime) {
  pushEvent('precios_loaded', {
    num_partidas: numPartidas,
    source: source,
    load_time_ms: loadTime
  });
}

/**
 * Track cuando el usuario realiza una búsqueda
 * @param {string} query - Texto de búsqueda
 * @param {number} numResultados - Número de resultados encontrados
 */
export function trackSearch(query, numResultados) {
  pushEvent('search', {
    search_term: query,
    num_results: numResultados
  });
}

/**
 * Track cuando se agrega una partida al presupuesto
 * @param {string} codigo - Código de la partida
 * @param {string} descripcion - Descripción de la partida
 * @param {number} precio - Precio unitario
 * @param {number} cantidad - Cantidad agregada
 */
export function trackPartidaAgregada(codigo, descripcion, precio, cantidad) {
  pushEvent('partida_agregada', {
    codigo: codigo,
    descripcion: descripcion,
    precio: precio,
    cantidad: cantidad,
    total: precio * cantidad
  });
}

/**
 * Track cuando se eliminan múltiples partidas
 * @param {number} numPartidas - Número de partidas agregadas
 */
export function trackPartidasAgregadas(numPartidas) {
  pushEvent('partidas_agregadas_bulk', {
    num_partidas: numPartidas
  });
}

/**
 * Track cuando se elimina una partida
 * @param {string} codigo - Código de la partida eliminada
 */
export function trackPartidaEliminada(codigo) {
  pushEvent('partida_eliminada', {
    codigo: codigo
  });
}

/**
 * Track cuando se actualiza la cantidad de una partida
 * @param {string} codigo - Código de la partida
 * @param {number} cantidadAnterior - Cantidad anterior
 * @param {number} cantidadNueva - Nueva cantidad
 */
export function trackCantidadActualizada(codigo, cantidadAnterior, cantidadNueva) {
  pushEvent('cantidad_actualizada', {
    codigo: codigo,
    cantidad_anterior: cantidadAnterior,
    cantidad_nueva: cantidadNueva
  });
}

/**
 * Track cuando se exporta un presupuesto
 * @param {number} numPartidas - Número de partidas en el presupuesto
 * @param {number} subtotal - Subtotal sin IVA
 * @param {number} total - Total con IVA
 */
export function trackPresupuestoExportado(numPartidas, subtotal, total) {
  pushEvent('presupuesto_exportado', {
    num_partidas: numPartidas,
    subtotal: subtotal,
    total: total,
    iva: total - subtotal
  });
}

/**
 * Track cuando se agrega una partida manual (por código)
 * @param {string} codigo - Código de la partida
 * @param {boolean} esPersonalizada - Si es partida personalizada o de la BD
 */
export function trackPartidaManual(codigo, esPersonalizada) {
  pushEvent('partida_manual_agregada', {
    codigo: codigo,
    es_personalizada: esPersonalizada
  });
}

/**
 * Track errores o advertencias importantes
 * @param {string} errorType - Tipo de error
 * @param {string} message - Mensaje de error
 */
export function trackError(errorType, message) {
  pushEvent('app_error', {
    error_type: errorType,
    error_message: message
  });
}

/**
 * Track cuando el usuario selecciona/deselecciona partidas antes de confirmar
 * @param {number} grupoId - ID del grupo de búsqueda
 * @param {number} numSeleccionadas - Número de partidas seleccionadas
 */
export function trackSeleccionPartidas(grupoId, numSeleccionadas) {
  pushEvent('partidas_seleccionadas', {
    grupo_id: grupoId,
    num_seleccionadas: numSeleccionadas
  });
}
