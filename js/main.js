/**
 * Módulo principal de la aplicación
 * Coordina todos los módulos y gestiona el flujo de la aplicación
 */

import { loadPrecios } from './precios-loader.js';
import { buscarPartidas } from './search.js';
import {
  getPresupuesto,
  agregarPartida,
  agregarPartidas,
  actualizarCantidad,
  eliminarPartida,
  exportarPresupuesto
} from './presupuesto.js';
import {
  addMessage,
  renderPresupuesto,
  renderOpcionesPartidas,
  updateConfirmButton,
  deshabilitarBotonConfirmacion,
  setEnviarButtonEnabled,
  getUserInputAndClear,
  focusUserInput
} from './ui.js';
import {
  trackPreciosLoaded,
  trackSearch,
  trackPartidaAgregada,
  trackPartidasAgregadas,
  trackPartidaEliminada,
  trackCantidadActualizada,
  trackPresupuestoExportado,
  trackPartidaManual,
  trackSeleccionPartidas
} from './analytics.js';

// Estado de la aplicación
let preciosDB = [];
let isProcessing = false;
let partidasSeleccionadas = [];

/**
 * Inicializa la aplicación
 */
async function init() {
  // Cargar base de datos de precios
  const startTime = Date.now();
  preciosDB = await loadPrecios((type, message) => {
    // Eliminar mensaje de carga si existe
    const loadingMsg = document.querySelector('.message.system');
    if (loadingMsg && loadingMsg.textContent.includes('Cargando')) {
      loadingMsg.remove();
    }
    addMessage(type, message);

    // Track carga de precios
    if (message.includes('Base de datos cargada')) {
      const loadTime = Date.now() - startTime;
      const source = message.includes('caché') ? 'cache' :
                     message.includes('Modo offline') ? 'fallback' : 'network';
      trackPreciosLoaded(preciosDB.length, source, loadTime);
    }
  });

  // Event listeners
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('userInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Exponer funciones globales para agregar partida manual
  window.agregarPartidaManual = agregarPartidaManual;
}

/**
 * Envía un mensaje y procesa la búsqueda
 */
function sendMessage() {
  const text = getUserInputAndClear();

  if (!text || isProcessing) return;

  generarPresupuestoIA(text);
}

/**
 * Genera presupuesto con IA local (búsqueda heurística)
 * @param {string} descripcion - Descripción del usuario
 */
async function generarPresupuestoIA(descripcion) {
  addMessage('user', descripcion);
  addMessage('system', '🔍 Buscando partidas relevantes...');

  isProcessing = true;
  setEnviarButtonEnabled(false);

  try {
    // Buscar partidas relevantes
    const partidasRelevantes = buscarPartidas(descripcion, preciosDB, 10);

    // Track búsqueda
    trackSearch(descripcion, partidasRelevantes.length);

    if (partidasRelevantes.length === 0) {
      addMessage('assistant', '❌ No encontré partidas que coincidan con tu descripción. Intenta ser más específico o usa términos técnicos como "excavación", "demolición", "movimiento de tierras", etc.');
      return;
    }

    // Mostrar opciones encontradas
    const grupoId = Date.now() + Math.random(); // ID único para cada búsqueda
    addMessage('system', `✅ Encontré ${partidasRelevantes.length} partidas similares (mostrando ${Math.min(5, partidasRelevantes.length)}):`);

    renderOpcionesPartidas(
      partidasRelevantes,
      partidasRelevantes.length,
      grupoId,
      togglePartida,
      confirmarSeleccion
    );

    addMessage('assistant', '👆 Selecciona una o varias partidas y confirma. Luego puedes seguir buscando más.');

  } catch (error) {
    console.error('Error:', error);
    addMessage('system', '⚠️ Error procesando la solicitud. Intenta de nuevo.');
  } finally {
    isProcessing = false;
    setEnviarButtonEnabled(true);
  }
}

/**
 * Alterna la selección de una partida
 * @param {HTMLElement} elemento - Elemento DOM de la partida
 * @param {string} codigo - Código de la partida
 * @param {number} grupoId - ID del grupo de búsqueda
 */
function togglePartida(elemento, codigo, grupoId) {
  const partida = preciosDB.find(p => p.cod === codigo);
  if (!partida) {
    console.error('Partida no encontrada:', codigo);
    return;
  }

  const index = partidasSeleccionadas.findIndex(p => p.cod === codigo && p.grupoId === grupoId);

  if (index >= 0) {
    // Deseleccionar
    partidasSeleccionadas.splice(index, 1);
    elemento.classList.remove('selected');
  } else {
    // Seleccionar
    partidasSeleccionadas.push({ ...partida, grupoId });
    elemento.classList.add('selected');
  }

  // Actualizar botón de confirmación del grupo específico
  const partidasGrupo = partidasSeleccionadas.filter(p => p.grupoId === grupoId);
  updateConfirmButton(grupoId, partidasGrupo.length);

  // Track selección de partidas
  trackSeleccionPartidas(grupoId, partidasGrupo.length);
}

/**
 * Confirma la selección de partidas de un grupo
 * @param {number} grupoId - ID del grupo de búsqueda
 */
function confirmarSeleccion(grupoId) {
  const partidasGrupo = partidasSeleccionadas.filter(p => p.grupoId === grupoId);

  if (partidasGrupo.length === 0) return;

  // Agregar partidas al presupuesto
  for (const partida of partidasGrupo) {
    agregarPartida({
      cod: partida.cod,
      res: partida.res,
      uni: partida.uni,
      precio: partida.precio,
      desc: partida.desc,
      cantidad: 1
    });
    addMessage('system', `✅ Agregado: ${partida.cod} - ${partida.res}`);

    // Track partida agregada
    trackPartidaAgregada(partida.cod, partida.res, partida.precio, 1);
  }

  // Track múltiples partidas agregadas
  if (partidasGrupo.length > 1) {
    trackPartidasAgregadas(partidasGrupo.length);
  }

  renderPresupuesto(
    handleUpdateCantidad,
    handleEliminarPartida,
    handleExportarPresupuesto
  );

  const numPartidas = partidasGrupo.length;
  addMessage('assistant', `✅ ${numPartidas === 1 ? 'Partida agregada' : numPartidas + ' partidas agregadas'}. Puedes ajustar cantidades en el panel derecho o seguir buscando más partidas.`);

  // Remover solo las partidas de este grupo
  partidasSeleccionadas = partidasSeleccionadas.filter(p => p.grupoId !== grupoId);

  // Deshabilitar botón de este grupo
  deshabilitarBotonConfirmacion(grupoId);

  // Enfocar en el input para continuar buscando
  focusUserInput();
}

/**
 * Maneja la actualización de cantidad de una partida
 * @param {number} index - Índice de la partida
 * @param {string} value - Nuevo valor
 */
function handleUpdateCantidad(index, value) {
  const presupuesto = getPresupuesto();
  const partida = presupuesto[index];
  const cantidadAnterior = partida ? partida.cantidad : 0;

  actualizarCantidad(index, value);

  // Track cambio de cantidad
  if (partida) {
    trackCantidadActualizada(partida.cod, cantidadAnterior, parseFloat(value) || 0);
  }

  renderPresupuesto(
    handleUpdateCantidad,
    handleEliminarPartida,
    handleExportarPresupuesto
  );
}

/**
 * Maneja la eliminación de una partida
 * @param {number} index - Índice de la partida
 */
function handleEliminarPartida(index) {
  const presupuesto = getPresupuesto();
  const partida = presupuesto[index];

  if (!partida || !confirm(`¿Eliminar partida "${partida.cod} - ${partida.res}"?`)) {
    return;
  }

  eliminarPartida(index);

  // Track partida eliminada
  trackPartidaEliminada(partida.cod);

  renderPresupuesto(
    handleUpdateCantidad,
    handleEliminarPartida,
    handleExportarPresupuesto
  );
  addMessage('system', `🗑️ Partida eliminada: ${partida.cod}`);
}

/**
 * Maneja la exportación del presupuesto
 */
function handleExportarPresupuesto() {
  const presupuesto = getPresupuesto();
  const subtotal = presupuesto.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);
  const total = subtotal * 1.21;

  // Track exportación
  trackPresupuestoExportado(presupuesto.length, subtotal, total);

  exportarPresupuesto();
  addMessage('system', '✅ Ventana de impresión abierta');
}

/**
 * Agrega una partida manualmente por código
 */
function agregarPartidaManual() {
  const codigo = prompt('Código de la partida (ej: D02AA100):');
  if (!codigo) return;

  const partida = preciosDB.find(p => p.cod.toUpperCase() === codigo.toUpperCase());

  if (partida) {
    // Partida encontrada en la base de datos
    const cantidad = prompt(`Cantidad de "${partida.res}" (${partida.uni}):`, '1');
    if (cantidad && !isNaN(cantidad) && parseFloat(cantidad) > 0) {
      agregarPartida({
        ...partida,
        cantidad: parseFloat(cantidad)
      });

      // Track partida manual
      trackPartidaManual(partida.cod, false);
      trackPartidaAgregada(partida.cod, partida.res, partida.precio, parseFloat(cantidad));

      renderPresupuesto(
        handleUpdateCantidad,
        handleEliminarPartida,
        handleExportarPresupuesto
      );
      addMessage('system', `✅ Partida agregada: ${partida.cod} - ${partida.res} (${cantidad} ${partida.uni})`);
    }
  } else {
    // Partida no encontrada, permitir crear una personalizada
    const crear = confirm(`No se encontró la partida "${codigo}" en la base de datos.\n\n¿Deseas crear una partida personalizada?`);
    if (!crear) return;

    const descripcion = prompt('Descripción de la partida:');
    if (!descripcion) return;

    const precio = prompt('Precio unitario (€):');
    if (!precio || isNaN(precio) || parseFloat(precio) < 0) return;

    const unidad = prompt('Unidad (ej: m2, m3, ud, ml):', 'ud');
    if (!unidad) return;

    const cantidad = prompt('Cantidad:', '1');
    if (!cantidad || isNaN(cantidad) || parseFloat(cantidad) <= 0) return;

    const codigoFinal = codigo.toUpperCase();
    agregarPartida({
      cod: codigoFinal,
      res: descripcion,
      uni: unidad,
      precio: parseFloat(precio),
      desc: descripcion,
      cantidad: parseFloat(cantidad)
    });

    // Track partida personalizada
    trackPartidaManual(codigoFinal, true);
    trackPartidaAgregada(codigoFinal, descripcion, parseFloat(precio), parseFloat(cantidad));

    renderPresupuesto(
      handleUpdateCantidad,
      handleEliminarPartida,
      handleExportarPresupuesto
    );
    addMessage('system', `✅ Partida personalizada agregada: ${codigoFinal} - ${descripcion} (${cantidad} ${unidad})`);
  }
}

// Inicializar aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
