  function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    const btn = document.getElementById('hamburger');
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  }

  document.addEventListener('DOMContentLoaded', () => {
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
  });
