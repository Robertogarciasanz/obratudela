/* =================================================================
   Funcionalidades globales para ObraTudela.com
   ================================================================= */

document.addEventListener('DOMContentLoaded', () => {

    /**
     * LÓGICA PARA EL BOTÓN "VOLVER ARRIBA"
     */
    const backToTopButton = document.getElementById('backToTop');

    if (backToTopButton) {
        // Mostrar/ocultar el botón al hacer scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });

        // Scroll suave hacia arriba al hacer clic
        backToTopButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /**
     * LÓGICA PARA NAVEGACIÓN UNIFICADA
     */
    const hamburgerBtn = document.getElementById('hamburgerMenu');
    const mobileMenuPanel = document.getElementById('mobileMenuPanel');

    if (hamburgerBtn && mobileMenuPanel) {
        // Abrir/cerrar menú móvil
        hamburgerBtn.addEventListener('click', () => {
            const isOpen = mobileMenuPanel.classList.toggle('open');
            hamburgerBtn.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Cerrar menú al hacer clic en un enlace (para navegación en la misma página)
        mobileMenuPanel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuPanel.classList.remove('open');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    // Lógica para desplegables en escritorio
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
        const toggle = dropdown.querySelector('.nav-dropdown-toggle');
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('open');
        });
    });

    // Cerrar desplegables al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
        }
    });
});