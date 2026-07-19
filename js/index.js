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

    // Dropdown de Servicios: abrir/cerrar con clic (además del hover de CSS)
    const dropdown = document.querySelector('.nav-dropdown');
    if (dropdown) {
      const trigger = dropdown.querySelector(':scope > a');
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        dropdown.classList.toggle('open');
      });

      // Cerrar al hacer clic fuera
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });

      // Cerrar al seleccionar una opción del dropdown
      dropdown.querySelectorAll('.nav-dropdown-menu a').forEach(a => {
        a.addEventListener('click', () => {
          dropdown.classList.remove('open');
        });
      });
    }
  });

