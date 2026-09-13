  const FOTOS_OBRA_MOLINO = [
    { base: 'img/obra-molino-fachada-1', alt: 'Fachada del molino antes de la reforma' },
    { base: 'img/obra-molino-cat-1', alt: 'Excavadora CAT demoliendo un muro del molino' },
    { base: 'img/obra-molino-cat-2', alt: 'Excavadora CAT trabajando junto a la fachada' },
    { base: 'img/obra-molino-viga', alt: 'Viga de madera original de la cubierta' },
    { base: 'img/obra-molino-fachada-2', alt: 'Vista general del molino durante la obra' },
  ];
  let lightboxObraIndice = 0;

  function mostrarFotoLightboxObra() {
    const foto = FOTOS_OBRA_MOLINO[lightboxObraIndice];
    const img = document.getElementById('lightboxObraImg');
    img.src = `${foto.base}-800w.webp`;
    img.srcset = `${foto.base}-400w.webp 400w, ${foto.base}-800w.webp 800w`;
    img.sizes = '90vw';
    img.alt = foto.alt;
    document.getElementById('lightboxObraContador').textContent =
      `${lightboxObraIndice + 1} / ${FOTOS_OBRA_MOLINO.length}`;
  }

  function abrirLightboxObra(indice) {
    lightboxObraIndice = indice;
    mostrarFotoLightboxObra();
    document.getElementById('lightboxObra').classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function cerrarLightboxObra() {
    document.getElementById('lightboxObra').classList.remove('visible');
    document.body.style.overflow = '';
  }

  function navegarLightboxObra(delta) {
    lightboxObraIndice = (lightboxObraIndice + delta + FOTOS_OBRA_MOLINO.length) % FOTOS_OBRA_MOLINO.length;
    mostrarFotoLightboxObra();
  }

  function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    const btn = document.getElementById('hamburger');
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Cerrar menú móvil al hacer clic en un enlace
    document.querySelectorAll('.mobile-menu a').forEach(a => {
      a.addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.remove('open');
        document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
      });
    });

    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
      hamburger.addEventListener('click', toggleMenu);
    }

    // Dropdowns: abrir/cerrar con clic en móvil
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
      const trigger = dropdown.querySelector(':scope > a');
      if (trigger) {
        trigger.addEventListener('click', (e) => {
          // Cerrar otros dropdowns
          document.querySelectorAll('.nav-dropdown.open').forEach(d => {
            if (d !== dropdown) d.classList.remove('open');
          });
          // Toggle este dropdown
          e.preventDefault();
          dropdown.classList.toggle('open');
        });
      }

      // Cerrar al seleccionar una opción
      dropdown.querySelectorAll('.nav-dropdown-menu a').forEach(a => {
        a.addEventListener('click', () => {
          dropdown.classList.remove('open');
        });
      });
    });

    // Cerrar dropdowns al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-dropdown')) {
        document.querySelectorAll('.nav-dropdown.open').forEach(d => {
          d.classList.remove('open');
        });
      }
    });

    // Lightbox de fotos de la obra del molino
    const fotoObraMolino = document.getElementById('fotoObraMolino');
    if (fotoObraMolino) {
      fotoObraMolino.addEventListener('click', () => abrirLightboxObra(0));
    }

    const lightboxObra = document.getElementById('lightboxObra');
    if (lightboxObra) {
      document.getElementById('lightboxObraCerrar').addEventListener('click', cerrarLightboxObra);
      document.getElementById('lightboxObraAnterior').addEventListener('click', () => navegarLightboxObra(-1));
      document.getElementById('lightboxObraSiguiente').addEventListener('click', () => navegarLightboxObra(1));
      lightboxObra.addEventListener('click', (e) => {
        if (e.target === lightboxObra) cerrarLightboxObra();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (!lightboxObra || !lightboxObra.classList.contains('visible')) return;
      if (e.key === 'Escape') cerrarLightboxObra();
      if (e.key === 'ArrowLeft') navegarLightboxObra(-1);
      if (e.key === 'ArrowRight') navegarLightboxObra(1);
    });
  });

