/**
 * Módulo de gestión del presupuesto
 * Maneja la colección de partidas, cálculos y exportación
 */

/**
 * Estado del presupuesto actual
 */
let currentPresupuesto = [];

/**
 * Obtiene el presupuesto actual
 * @returns {Array} Array de partidas del presupuesto
 */
export function getPresupuesto() {
  return currentPresupuesto;
}

/**
 * Agrega una partida al presupuesto
 * @param {Object} partida - Partida a agregar
 */
export function agregarPartida(partida) {
  currentPresupuesto.push({
    cod: partida.cod,
    res: partida.res,
    uni: partida.uni,
    precio: partida.precio,
    desc: partida.desc,
    cantidad: partida.cantidad || 1
  });
}

/**
 * Agrega múltiples partidas al presupuesto
 * @param {Array} partidas - Array de partidas a agregar
 */
export function agregarPartidas(partidas) {
  partidas.forEach(p => agregarPartida(p));
}

/**
 * Actualiza la cantidad de una partida
 * @param {number} index - Índice de la partida
 * @param {number} cantidad - Nueva cantidad
 */
export function actualizarCantidad(index, cantidad) {
  if (index >= 0 && index < currentPresupuesto.length) {
    currentPresupuesto[index].cantidad = parseFloat(cantidad) || 0;
  }
}

/**
 * Elimina una partida del presupuesto
 * @param {number} index - Índice de la partida a eliminar
 * @returns {Object} Partida eliminada
 */
export function eliminarPartida(index) {
  if (index >= 0 && index < currentPresupuesto.length) {
    return currentPresupuesto.splice(index, 1)[0];
  }
  return null;
}

/**
 * Calcula los totales del presupuesto
 * @returns {Object} Objeto con subtotal, iva y total
 */
export function calcularTotales() {
  const subtotal = currentPresupuesto.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  return { subtotal, iva, total };
}

/**
 * Limpia el presupuesto
 */
export function limpiarPresupuesto() {
  currentPresupuesto = [];
}

/**
 * Genera HTML para exportar el presupuesto a imprimir
 * @returns {string} HTML completo del presupuesto
 */
export function generarHTMLExportacion() {
  const { subtotal, iva, total } = calcularTotales();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Presupuesto - EXCAVACIONES Y SERVICIOS ARTURO S.L.</title>
  <style>
    @page { margin: 2cm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ff6b00; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { display: flex; align-items: center; gap: 15px; }
    .logo img { height: 80px; border-radius: 8px; }
    .logo-text h1 { color: #ff6b00; font-size: 24px; margin-bottom: 5px; }
    .logo-text p { font-size: 12px; color: #666; }
    .company-info { text-align: right; font-size: 13px; line-height: 1.8; }
    .company-info strong { color: #ff6b00; }
    .presupuesto-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .presupuesto-info h2 { color: #ff6b00; font-size: 18px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead { background: #ff6b00; color: white; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { font-weight: 600; font-size: 13px; }
    td { font-size: 12px; }
    .cod { font-weight: 600; color: #ff6b00; font-size: 11px; }
    .cantidad-col { text-align: center; }
    .precio-col { text-align: right; }
    .total-col { text-align: right; font-weight: 600; }
    .totales { margin-left: auto; width: 350px; border-top: 3px solid #ff6b00; padding-top: 15px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .total-row.final { font-size: 20px; font-weight: bold; color: #ff6b00; border-top: 2px solid #333; margin-top: 10px; padding-top: 15px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #666; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <img src="img/logo.jpg" alt="Logo ObraTudela">
      <div class="logo-text">
        <h1>EXCAVACIONES Y SERVICIOS ARTURO S.L.</h1>
        <p>Movimiento de tierras y construcción</p>
      </div>
    </div>
    <div class="company-info">
      <strong>NIF:</strong> B47489612<br>
      <strong>Email:</strong> excavacionesart@gmail.com<br>
      <strong>Teléfono:</strong> 607 444 903
    </div>
  </div>
  <div class="presupuesto-info">
    <h2>PRESUPUESTO</h2>
    <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
    <strong>Nº Partidas:</strong> ${currentPresupuesto.length}
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 12%">CÓDIGO</th>
        <th style="width: 48%">DESCRIPCIÓN</th>
        <th style="width: 12%" class="cantidad-col">CANTIDAD</th>
        <th style="width: 14%" class="precio-col">PRECIO UNIT.</th>
        <th style="width: 14%" class="total-col">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${currentPresupuesto.map(p => `<tr>
        <td><span class="cod">${p.cod}</span></td>
        <td>
          <strong>${p.res}</strong>
          ${p.desc ? `<br><span style="font-size: 0.85em; color: #666;">${p.desc}</span>` : ''}
        </td>
        <td class="cantidad-col">${p.cantidad} ${p.uni}</td>
        <td class="precio-col">${p.precio.toFixed(2)} €</td>
        <td class="total-col">${(p.cantidad * p.precio).toFixed(2)} €</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="totales">
    <div class="total-row">
      <span>Subtotal (sin IVA):</span>
      <span><strong>${subtotal.toFixed(2)} €</strong></span>
    </div>
    <div class="total-row">
      <span>IVA (21%):</span>
      <span><strong>${iva.toFixed(2)} €</strong></span>
    </div>
    <div class="total-row final">
      <span>TOTAL:</span>
      <span>${total.toFixed(2)} €</span>
    </div>
  </div>
  <div class="footer">
    Presupuesto generado el ${new Date().toLocaleString('es-ES')}<br>
    Este presupuesto tiene una validez de 30 días desde la fecha de emisión
  </div>
</body>
</html>`;
}

/**
 * Abre ventana de impresión con el presupuesto
 */
export function exportarPresupuesto() {
  const htmlContent = generarHTMLExportacion();
  const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');

  ventanaImpresion.document.write(htmlContent);
  ventanaImpresion.document.close();

  // Activar impresión después de cargar
  setTimeout(() => {
    ventanaImpresion.print();
  }, 500);
}
