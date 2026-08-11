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
  });

