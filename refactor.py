import os
import re

base_dir = r'f:\obratudela'

def refactor_file(filename, css_filename, js_filename=None):
    filepath = os.path.join(base_dir, filename)
    if not os.path.exists(filepath):
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Extract CSS
    style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if style_match:
        css = style_match.group(1).strip()
        css = css.replace("url('fonts/", "url('../fonts/")
        css = css.replace("url('img/", "url('../img/")
        
        os.makedirs(os.path.join(base_dir, 'css'), exist_ok=True)
        with open(os.path.join(base_dir, 'css', css_filename), 'w', encoding='utf-8') as f:
            f.write(css)
            
        # Add link tag
        link_tag = f'<link rel="stylesheet" href="css/{css_filename}">'
        # We also need to add global.css
        # Check if global.css is already linked
        if 'global.css' not in content:
            link_tag = f'<link rel="stylesheet" href="css/global.css">\n  ' + link_tag
            
        content = content.replace(style_match.group(0), link_tag)

    # Extract JS
    if js_filename:
        script_match = re.search(r'<script>(.*?)</script>', content, re.DOTALL)
        if script_match:
            js = script_match.group(1).strip()
            
            os.makedirs(os.path.join(base_dir, 'js'), exist_ok=True)
            with open(os.path.join(base_dir, 'js', js_filename), 'w', encoding='utf-8') as f:
                f.write(js)
                
            script_tag = f'<script src="js/{js_filename}" defer></script>'
            if 'global.js' not in content:
                script_tag = f'<script src="js/global.js" defer></script>\n' + script_tag
                
            content = content.replace(script_match.group(0), script_tag)

    # Specific fix for index.html inline JS
    if filename == 'index.html':
        content = content.replace(' onclick="toggleMenu()"', '')
        # Add event listener to js/index.js
        index_js_path = os.path.join(base_dir, 'js', 'index.js')
        if os.path.exists(index_js_path):
            with open(index_js_path, 'a', encoding='utf-8') as f:
                f.write('\n\ndocument.addEventListener("DOMContentLoaded", () => {\n  const btn = document.getElementById("hamburger");\n  if (btn) btn.addEventListener("click", toggleMenu);\n});\n')

    # Specific fix for anuncios.html inline JS and CLS
    if filename == 'anuncios.html':
        # Remove inline onclicks
        content = re.sub(r'\sonclick="[^"]+"', '', content)
        # Fix CLS in JS
        anuncios_js_path = os.path.join(base_dir, 'js', 'anuncios.js')
        if os.path.exists(anuncios_js_path):
            with open(anuncios_js_path, 'r', encoding='utf-8') as f:
                js = f.read()
            # Add width and height to images
            js = js.replace('<img src="${foto}" alt="${a.titulo}"', '<img src="${foto}" alt="${a.titulo}" width="360" height="240"')
            # Add event listeners for the inline onclicks we removed
            js += '''

document.addEventListener("DOMContentLoaded", () => {
    // Buscar event listeners
    const buscadorInput = document.getElementById('buscador');
    const buscarBtn = document.querySelector('.btn-buscar');
    if (buscadorInput) buscadorInput.addEventListener('input', filtrarAnuncios);
    if (buscarBtn) buscarBtn.addEventListener('click', filtrarAnuncios);
    
    // Categorias
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            let cat = this.textContent.replace(/[\\u1000-\\uFFFF]+/, '').trim();
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
    
    // Sidebar filtros
    const btnFiltros = document.querySelector('.btn-filtrar');
    if (btnFiltros) btnFiltros.addEventListener('click', filtrarAnuncios);
    const btnLimpiar = document.querySelector('.btn-limpiar');
    if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarFiltros);
    
    // Filtro movil
    const btnFiltrosMovil = document.querySelector('.btn-filtros-movil');
    if (btnFiltrosMovil) btnFiltrosMovil.addEventListener('click', toggleFiltros);
    const sidebarCerrar = document.querySelector('.sidebar-cerrar');
    if (sidebarCerrar) sidebarCerrar.addEventListener('click', cerrarFiltros);
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', cerrarFiltros);
});
'''
            with open(anuncios_js_path, 'w', encoding='utf-8') as f:
                f.write(js)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

os.makedirs(os.path.join(base_dir, 'css'), exist_ok=True)
os.makedirs(os.path.join(base_dir, 'js'), exist_ok=True)

# Create global.css and global.js
with open(os.path.join(base_dir, 'css', 'global.css'), 'w', encoding='utf-8') as f:
    f.write('/* Global CSS */\n')
with open(os.path.join(base_dir, 'js', 'global.js'), 'w', encoding='utf-8') as f:
    f.write('/* Global JS */\n')

# Process files
refactor_file('index.html', 'index.css', 'index.js')
refactor_file('anuncios.html', 'anuncios.css', 'anuncios.js')
refactor_file('alquileres.html', 'alquileres.css', 'alquileres.js')
refactor_file('presupuesto_v2.html', 'presupuesto.css', 'presupuesto.js')
refactor_file('topografia.html', 'topografia.css', 'topografia.js')
refactor_file('aviso-legal.html', 'aviso-legal.css')

print("Refactorización completada exitosamente.")
