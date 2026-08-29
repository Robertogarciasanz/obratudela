let anuncios = [];
let categoriaActiva = 'Todos';
let galeriaActual = { fotos: [], indice: 0 };

function escapeHtml(s) {
  return (s ?? '').toString().replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function inyectarSchemaProductos(items) {
  const el = document.getElementById('schema-productos');
  if (el) el.remove();
  if (!items.length) return;
  const lista = items.map((a, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "item": {
      "@type": "Product",
      "name": a.titulo,
      "description": a.descripcion || undefined,
      "category": a.categoria || "Maquinaria",
      "offers": {
        "@type": "Offer",
        "price": a.precio > 0 ? String(a.precio) : undefined,
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock",
        "seller": {"@type": "Organization", "name": "Excavaciones y Servicios Arturo S.L.", "telephone": "+34607444903"}
      }
    }
  }));
  const schema = {"@context": "https://schema.org", "@type": "ItemList", "name": "Artículos en venta — ObraTudela", "numberOfItems": items.length, "itemListElement": lista};
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'schema-productos';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

fetch('../data/anuncios.json')
  .then(r => r.json())
  .then(data => {
    anuncios = data;
    filtrarAnuncios();
    inyectarSchemaProductos(anuncios);
  })
  .catch(() => {
    document.getElementById('gridAnuncios').innerHTML = '<div class="sin-resultados"><span class="emoji">📋</span>No hay artículos disponibles.</div>';
    document.getElementById('contadorAnuncios').textContent = '0';
  });

// RENDER
function renderTarjetas(lista) {
  document.getElementById('contadorAnuncios').textContent = lista.length;
  const grid = document.getElementById('gridAnuncios');

  if (!lista.length) {
    grid.innerHTML = `<div class="sin-resultados"><span class="emoji">🔍</span>Sin resultados. Prueba otros filtros.</div>`;
    return;
  }

  grid.innerHTML = lista.map((a, index) => {
    const foto = a.fotos && a.fotos.length ? a.fotos[0] : null;
    const n = a.fotos ? a.fotos.length : 0;
    const precio = a.precio > 0 ? `${a.precio.toLocaleString('es-ES')}€` : 'A convenir';
    const d = Math.floor((Date.now() - new Date(a.fecha)) / 86400000);
    const cuando = d === 0 ? 'Hoy' : d === 1 ? 'Ayer' : `Hace ${d} días`;
    return `
      <div class="tarjeta" data-id="${a.id}">
        <div class="tarjeta-foto">
          ${foto ? `<img src="${escapeHtml(foto)}" alt="${escapeHtml(a.titulo)}" width="360" height="240" loading="${index === 0 ? 'eager' : 'lazy'}">` : `<div class="placeholder-foto">${escapeHtml(a.emoji||'🏗️')}</div>`}
          ${a.destacado ? '<span class="badge-destacado">⭐ Destacado</span>' : ''}
          ${n > 1 ? `<span class="badge-fotos">📷 ${n}</span>` : ''}
        </div>
        <div class="tarjeta-body">
          <div class="tarjeta-titulo">${escapeHtml(a.titulo)}</div>
          <div class="tarjeta-precio">${precio}</div>
          <div class="tarjeta-meta">
            <span>📍 ${escapeHtml(a.provincia)}</span>
            <span class="badge-activo">✓ Activo</span>
          </div>
          <div style="font-size:11px;color:#444;margin-top:4px;">${escapeHtml(a.categoria)} · ${cuando}</div>
        </div>
      </div>`;
  }).join('');

  // Add event listeners to new cards
  document.querySelectorAll('.tarjeta').forEach(t => {
      t.addEventListener('click', () => abrirDetalle(t.dataset.id));
  });
}

// FILTROS
function normalizarTexto(s) {
  return (s || '')
    .toString()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita acentos
    .toLowerCase()
    .trim();
}

function filtrarAnuncios() {
  const txt = normalizarTexto(document.getElementById('buscador').value);
  const palabras = txt.split(/\s+/).filter(Boolean);
  const pMin = parseFloat(document.getElementById('precioMin').value) || 0;
  const pMax = parseFloat(document.getElementById('precioMax').value) || Infinity;
  const prov = document.getElementById('filtroProvincia').value;
  const ord = document.getElementById('ordenar').value;

  let res = anuncios.filter(a => {
    const haystack = normalizarTexto([a.titulo, a.descripcion, a.categoria, a.provincia].join(' '));
    const okTxt = !palabras.length || palabras.every(p => haystack.includes(p));
    const okCat = categoriaActiva === 'Todos' || a.categoria === categoriaActiva;
    const okP = a.precio === 0 ? (pMin === 0 && pMax === Infinity) : (a.precio >= pMin && a.precio <= pMax);
    const okProv = !prov || a.provincia === prov;
    return okTxt && okCat && okP && okProv;
  });

  if (ord === 'precio-asc') res.sort((a,b) => a.precio - b.precio);
  else if (ord === 'precio-desc') res.sort((a,b) => b.precio - a.precio);
  else res.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

  renderTarjetas(res);
}

function filtrarCategoria(cat, btn) {
  categoriaActiva = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('activa'));
  btn.classList.add('activa');
  filtrarAnuncios();
}

function limpiarFiltros() {
  ['precioMin','precioMax','buscador'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('filtroProvincia').value = '';
  document.getElementById('ordenar').value = 'reciente';
  document.getElementById('ordenarMovil').value = 'reciente';
  categoriaActiva = 'Todos';
  document.querySelectorAll('.cat-btn').forEach((b,i) => b.classList.toggle('activa', i===0));
  filtrarAnuncios();
}

// DETALLE
function abrirDetalle(id) {
  const a = anuncios.find(x => x.id === id);
  if (!a) return;

  document.getElementById('modalTitulo').textContent = a.titulo;
  document.getElementById('modalPrecio').textContent = a.precio > 0 ? `${a.precio.toLocaleString('es-ES')}€` : 'A convenir';
  document.getElementById('modalDescripcion').textContent = a.descripcion || 'Sin descripción.';
  document.getElementById('modalProvincia').textContent = a.provincia;
  document.getElementById('modalTelefono').textContent = a.telefono || 'Consultar';
  document.getElementById('modalBtnLlamar').href = `tel:+34${(a.telefono||'').replace(/\s/g,'')}`;
  document.getElementById('modalTags').innerHTML = `
    <span class="modal-tag">📂 ${escapeHtml(a.categoria)}</span>
    <span class="modal-tag">📍 ${escapeHtml(a.provincia)}</span>
    ${a.destacado ? '<span class="modal-tag">⭐ Destacado</span>' : ''}
    <span class="modal-tag" style="background:rgba(46,204,113,0.1);color:#2ecc71;border-color:rgba(46,204,113,0.2);">✓ Activo</span>
  `;

  const fotos = a.fotos || [];
  galeriaActual = { fotos, indice: 0 };

  const imgG = document.getElementById('galeriaImgGrande');
  const ph   = document.getElementById('galeriaPlaceholder');
  const thumbs = document.getElementById('galeriaThumbs');
  const cnt  = document.getElementById('galeriaContador');
  const bPrev = document.getElementById('galeriaAnterior');
  const bNext = document.getElementById('galeriaSiguiente');

  if (fotos.length) {
    imgG.src = fotos[0]; imgG.style.display = 'block';
    ph.style.display = 'none';
    if (fotos.length > 1) {
      bPrev.style.display = bNext.style.display = 'flex';
      cnt.style.display = 'block';
      cnt.textContent = `Foto 1 de ${fotos.length}`;
      thumbs.style.display = 'flex';
      thumbs.innerHTML = fotos.map((f,i) =>
        `<img src="${escapeHtml(f)}" class="thumb ${i===0?'activa':''}" data-index="${i}" alt="Foto ${i+1}">`
      ).join('');
      // Add event listeners to thumbs
      thumbs.querySelectorAll('.thumb').forEach(t => {
          t.addEventListener('click', (e) => irFoto(parseInt(e.target.dataset.index)));
      });
    } else {
      bPrev.style.display = bNext.style.display = 'none';
      cnt.style.display = 'none';
      thumbs.style.display = 'none';
    }
  } else {
    ph.textContent = a.emoji || '🏗️';
    ph.style.display = 'flex'; imgG.style.display = 'none';
    bPrev.style.display = bNext.style.display = 'none';
    cnt.style.display = 'none'; thumbs.style.display = 'none';
  }

  document.getElementById('modalDetalle').classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function navegarGaleria(dir) {
  const t = galeriaActual.fotos.length;
  if (t < 2) return;
  irFoto((galeriaActual.indice + dir + t) % t);
}

function irFoto(idx) {
  galeriaActual.indice = idx;
  document.getElementById('galeriaImgGrande').src = galeriaActual.fotos[idx];
  document.getElementById('galeriaContador').textContent = `Foto ${idx+1} de ${galeriaActual.fotos.length}`;
  document.querySelectorAll('.thumb').forEach((t,i) => t.classList.toggle('activa', i===idx));
}

// ── UTILS ─────────────────────────────────────────────────────────────────────
function toggleFiltros() {
  const s = document.getElementById('sidebar');
  const b = document.getElementById('sidebarBackdrop');
  const open = s.classList.toggle('abierto');
  b.classList.toggle('v', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
function cerrarFiltros() {
  document.getElementById('sidebar').classList.remove('abierto');
  document.getElementById('sidebarBackdrop').classList.remove('v');
  document.body.style.overflow = '';
}

function cerrarModal(id) { document.getElementById(id).classList.remove('visible'); document.body.style.overflow = ''; }
function cerrarModalSiOverlay(e, id) { if (e.target === document.getElementById(id)) cerrarModal(id); }

function mostrarToast(msg, ok = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast visible' + (ok ? ' exito' : '');
  setTimeout(() => t.className = 'toast', 3200);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape')     cerrarModal('modalDetalle');
  if (e.key === 'ArrowLeft')  navegarGaleria(-1);
  if (e.key === 'ArrowRight') navegarGaleria(1);
});

// INITIALIZE EVENT LISTENERS FOR HTML
document.addEventListener("DOMContentLoaded", () => {
    const buscadorInput = document.getElementById('buscador');
    const buscarBtn = document.querySelector('.btn-buscar');
    if (buscadorInput) buscadorInput.addEventListener('input', filtrarAnuncios);
    if (buscarBtn) buscarBtn.addEventListener('click', filtrarAnuncios);
    
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            let cat = this.textContent.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
            if (cat.includes('Todos')) cat = 'Todos';
            else if (cat.includes('Maquinaria')) cat = 'Maquinaria';
            else if (cat.includes('Herramientas')) cat = 'Herramientas';
            else if (cat.includes('Materiales')) cat = 'Materiales';
            else if (cat.includes('Vehículos')) cat = 'Vehículos';
            else if (cat.includes('Electrónica')) cat = 'Electrónica';
            else if (cat.includes('Otros')) cat = 'Otros';
            filtrarCategoria(cat, this);
        });
    });
    
    const btnFiltros = document.querySelector('.btn-filtrar');
    if (btnFiltros) btnFiltros.addEventListener('click', filtrarAnuncios);
    const btnLimpiar = document.querySelector('.btn-limpiar');
    if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarFiltros);
    
    const btnFiltrosMovil = document.querySelector('.btn-filtros-movil');
    if (btnFiltrosMovil) btnFiltrosMovil.addEventListener('click', toggleFiltros);
    const sidebarCerrar = document.getElementById('sidebarCerrarBtn');
    if (sidebarCerrar) sidebarCerrar.addEventListener('click', cerrarFiltros);
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', cerrarFiltros);

    const filtroProvincia = document.getElementById('filtroProvincia');
    if (filtroProvincia) filtroProvincia.addEventListener('change', filtrarAnuncios);
    
    const ordenar = document.getElementById('ordenar');
    if (ordenar) ordenar.addEventListener('change', (e) => {
        const om = document.getElementById('ordenarMovil');
        if (om) om.value = e.target.value;
        filtrarAnuncios();
    });

    const ordenarMovil = document.getElementById('ordenarMovil');
    if (ordenarMovil) ordenarMovil.addEventListener('change', (e) => {
        const o = document.getElementById('ordenar');
        if (o) o.value = e.target.value;
        filtrarAnuncios();
    });

    const modalDetalle = document.getElementById('modalDetalle');
    if (modalDetalle) modalDetalle.addEventListener('click', (e) => cerrarModalSiOverlay(e, 'modalDetalle'));

    const modalCerrar = document.getElementById('modalCerrar');
    if (modalCerrar) modalCerrar.addEventListener('click', () => cerrarModal('modalDetalle'));

    const galeriaAnterior = document.getElementById('galeriaAnterior');
    if (galeriaAnterior) galeriaAnterior.addEventListener('click', () => navegarGaleria(-1));

    const galeriaSiguiente = document.getElementById('galeriaSiguiente');
    if (galeriaSiguiente) galeriaSiguiente.addEventListener('click', () => navegarGaleria(1));
});
