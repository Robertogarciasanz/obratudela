// ── EVENT LISTENERS ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', function() {
            const cat = this.closest('.category');
            const open = cat.classList.toggle('open');
            this.setAttribute('aria-expanded', open);
        });
    });
});

// ── MICRODATOS PRODUCTOS ──────────────────────────────────────────────────
(function() {
  const PROVEEDOR = 'Excavaciones y Servicios Arturo S.L.';
  const URL_WEB   = 'https://www.obratudela.com';

  document.querySelectorAll('tbody tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    if (cells.length < 4) return;

    // Producto
    tr.setAttribute('itemscope', '');
    tr.setAttribute('itemtype', 'https://schema.org/Product');

    // SKU
    cells[0].setAttribute('itemprop', 'sku');

    // Nombre + brand (proveedor como marca)
    cells[1].setAttribute('itemprop', 'name');
    const brandSpan = document.createElement('span');
    brandSpan.setAttribute('itemprop', 'brand');
    brandSpan.setAttribute('itemscope', '');
    brandSpan.setAttribute('itemtype', 'https://schema.org/Organization');
    brandSpan.innerHTML =
      `<meta itemprop="name" content="${PROVEEDOR}">` +
      `<meta itemprop="url"  content="${URL_WEB}">`;
    cells[1].appendChild(brandSpan);

    // Oferta con precio, moneda, disponibilidad y vendedor
    const priceCell = cells[3];
    priceCell.setAttribute('itemprop', 'offers');
    priceCell.setAttribute('itemscope', '');
    priceCell.setAttribute('itemtype', 'https://schema.org/Offer');

    const raw = priceCell.textContent.replace(/[^\d,]/g, '').replace(',', '.');
    const valor = parseFloat(raw);

    const priceSpan = document.createElement('span');
    priceSpan.setAttribute('itemprop', 'price');
    priceSpan.setAttribute('content', isNaN(valor) ? '0' : valor.toFixed(2));
    priceSpan.textContent = priceCell.textContent.trim();
    priceCell.textContent = '';
    priceCell.appendChild(priceSpan);

    [
      ['priceCurrency', 'EUR'],
      ['availability',  'https://schema.org/InStock']
    ].forEach(([prop, val]) => {
      const m = document.createElement('meta');
      m.setAttribute('itemprop', prop);
      m.setAttribute('content', val);
      priceCell.appendChild(m);
    });

    const sellerSpan = document.createElement('span');
    sellerSpan.setAttribute('itemprop', 'seller');
    sellerSpan.setAttribute('itemscope', '');
    sellerSpan.setAttribute('itemtype', 'https://schema.org/Organization');
    sellerSpan.innerHTML =
      `<meta itemprop="name" content="${PROVEEDOR}">` +
      `<meta itemprop="url"  content="${URL_WEB}">`;
    priceCell.appendChild(sellerSpan);
  });
})();
