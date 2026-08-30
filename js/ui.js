/**
 * Módulo de gestión de interfaz de usuario
 * Maneja el rendering del chat, presupuesto y elementos interactivos
 */

import { getPresupuesto, calcularTotales } from './presupuesto.js?v=2.1';

/**
 * Agrega un mensaje al chat
 * @param {string} type - Tipo de mensaje (user, assistant, system)
 * @param {string} text - Texto del mensaje
 */
export function addMessage(type, text) {
  const chatContainer = document.getElementById('chatContainer');
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;
  chatContainer.appendChild(message);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Agrega HTML personalizado al chat (para mostrar opciones de partidas)
 * @param {string} html - HTML a insertar
 */
export function addHTMLMessage(html) {
  const chatContainer = document.getElementById('chatContainer');
  const opcionesDiv = document.createElement('div');
  opcionesDiv.className = 'message assistant';
  opcionesDiv.innerHTML = html;
  chatContainer.appendChild(opcionesDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Renderiza el presupuesto en el panel derecho
 * @param {Function} onUpdateCantidad - Callback cuando se actualiza una cantidad
 * @param {Function} onEliminarPartida - Callback cuando se elimina una partida
 * @param {Function} onExportar - Callback cuando se exporta el presupuesto
 */
export function renderPresupuesto(onUpdateCantidad, onEliminarPartida, onExportar) {
  const preview = document.getElementById('presupuestoPreview');
  const presupuesto = getPresupuesto();

  if (presupuesto.length === 0) {
    preview.innerHTML = `
      <div class="presupuesto-empty">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <p>El presupuesto aparecerá aquí</p>
      </div>
    `;
    return;
  }

  let html = '';

  presupuesto.forEach((p, index) => {
    const total = p.precio * p.cantidad;

    html += `
      <div class="partida">
        <div class="partida-header">
          <span class="partida-cod">${p.cod}</span>
          <div>
            <span class="partida-precio">${p.precio.toFixed(2)}€/${p.uni}</span>
            <button onclick="window.eliminarPartidaHandler(${index})" style="background: #ff4444; border: none; color: white; padding: 4px 8px; margin-left: 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">×</button>
          </div>
        </div>
        <div class="partida-desc">${p.res}</div>
        ${p.desc ? `<div class="partida-desc-larga">${p.desc}</div>` : ''}
        <div class="partida-cantidad">
          <input
            type="number"
            value="${p.cantidad}"
            min="0.01"
            step="0.01"
            onchange="window.updateCantidadHandler(${index}, this.value)"
          >
          <span>${p.uni} × ${p.precio.toFixed(2)}€ = <strong>${total.toFixed(2)}€</strong></span>
        </div>
      </div>
    `;
  });

  const { subtotal, iva, total } = calcularTotales();

  html += `
    <div class="totales">
      <div class="total-row">
        <span>Subtotal (sin IVA)</span>
        <span>${subtotal.toFixed(2)}€</span>
      </div>
      <div class="total-row">
        <span>IVA (21%)</span>
        <span>${iva.toFixed(2)}€</span>
      </div>
      <div class="total-row final">
        <span>TOTAL</span>
        <span>${total.toFixed(2)}€</span>
      </div>
      <button class="btn btn-export" onclick="window.exportarPresupuestoHandler()">📥 Exportar Presupuesto</button>
    </div>
  `;

  preview.innerHTML = html;

  // Registrar handlers globales para eventos desde HTML inline
  window.updateCantidadHandler = onUpdateCantidad;
  window.eliminarPartidaHandler = onEliminarPartida;
  window.exportarPresupuestoHandler = onExportar;
}

/**
 * Renderiza opciones de partidas encontradas en la búsqueda
 * @param {Array} partidas - Array de partidas a mostrar
 * @param {number} total - Total de partidas encontradas
 * @param {number} grupoId - ID único del grupo de búsqueda
 * @param {Function} onTogglePartida - Callback al seleccionar/deseleccionar partida
 * @param {Function} onConfirmar - Callback al confirmar selección
 */
export function renderOpcionesPartidas(partidas, total, grupoId, onTogglePartida, onConfirmar) {
  const numMostrar = Math.min(5, partidas.length);

  let opcionesHTML = `<div class="opciones-partidas" data-grupo-container="${grupoId}">`;
  partidas.slice(0, 5).forEach((p) => {
    opcionesHTML += `
      <div class="opcion-partida" data-codigo="${p.cod}" data-grupo="${grupoId}" onclick="window.togglePartidaHandler(this, '${p.cod}', ${grupoId})">
        <div class="opcion-header">
          <span class="opcion-cod">${p.cod}</span>
          <span class="opcion-precio">${p.precio.toFixed(2)}€/${p.uni}</span>
        </div>
        <div class="opcion-desc">${p.res}</div>
      </div>
    `;
  });
  opcionesHTML += `<button class="btn" id="btnConfirmarSeleccion_${grupoId}" onclick="window.confirmarSeleccionHandler(${grupoId})" disabled style="margin-top: 12px; width: 100%;">Selecciona al menos una partida</button>`;
  opcionesHTML += '</div>';

  addHTMLMessage(opcionesHTML);

  // Registrar handlers globales
  window.togglePartidaHandler = onTogglePartida;
  window.confirmarSeleccionHandler = onConfirmar;
}

/**
 * Actualiza el botón de confirmación de un grupo de partidas
 * @param {number} grupoId - ID del grupo
 * @param {number} numPartidas - Número de partidas seleccionadas
 */
export function updateConfirmButton(grupoId, numPartidas) {
  const btnConfirm = document.getElementById(`btnConfirmarSeleccion_${grupoId}`);
  if (btnConfirm) {
    if (numPartidas > 0) {
      btnConfirm.textContent = `✓ Agregar ${numPartidas} partida${numPartidas > 1 ? 's' : ''} al presupuesto`;
      btnConfirm.disabled = false;
    } else {
      btnConfirm.textContent = 'Selecciona al menos una partida';
      btnConfirm.disabled = true;
    }
  }
}

/**
 * Deshabilita el botón de confirmación después de agregar partidas
 * @param {number} grupoId - ID del grupo
 */
export function deshabilitarBotonConfirmacion(grupoId) {
  const btnConfirm = document.getElementById(`btnConfirmarSeleccion_${grupoId}`);
  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.textContent = '✓ Partidas agregadas';
  }
}

/**
 * Habilita/deshabilita el botón de envío
 * @param {boolean} enabled - true para habilitar, false para deshabilitar
 */
export function setEnviarButtonEnabled(enabled) {
  const btn = document.getElementById('sendBtn');
  if (btn) {
    btn.disabled = !enabled;
  }
}

/**
 * Obtiene el valor del input de usuario y lo limpia
 * @returns {string} Texto ingresado por el usuario
 */
export function getUserInputAndClear() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  input.value = '';
  return text;
}

/**
 * Enfoca el input de usuario
 */
export function focusUserInput() {
  const input = document.getElementById('userInput');
  if (input) {
    input.focus();
  }
}
