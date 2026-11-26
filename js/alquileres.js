// ── EVENT LISTENERS ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', function() {
            const cat = this.closest('.category');
            const open = cat.classList.toggle('open');
            this.setAttribute('aria-expanded', open);
        });
        header.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
});
