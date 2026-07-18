const fs = require('fs');
const path = require('path');

const baseDir = __dirname;

function refactorFile(filename, cssFilename, jsFilename) {
    const filepath = path.join(baseDir, filename);
    if (!fs.existsSync(filepath)) return;
    
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Extract CSS
    const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
        let css = styleMatch[1].trim();
        css = css.replace(/url\('fonts\//g, "url('../fonts/");
        css = css.replace(/url\('img\//g, "url('../img/");
        
        fs.mkdirSync(path.join(baseDir, 'css'), { recursive: true });
        fs.writeFileSync(path.join(baseDir, 'css', cssFilename), css, 'utf8');
        
        let linkTag = `<link rel="stylesheet" href="css/${cssFilename}">`;
        if (!content.includes('global.css')) {
            linkTag = `<link rel="stylesheet" href="css/global.css">\n  ` + linkTag;
        }
        content = content.replace(styleMatch[0], linkTag);
    }

    // Extract JS
    if (jsFilename) {
        const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
        if (scriptMatch) {
            let js = scriptMatch[1].trim();
            
            fs.mkdirSync(path.join(baseDir, 'js'), { recursive: true });
            fs.writeFileSync(path.join(baseDir, 'js', jsFilename), js, 'utf8');
            
            let scriptTag = `<script src="js/${jsFilename}" defer></script>`;
            if (!content.includes('global.js')) {
                scriptTag = `<script src="js/global.js" defer></script>\n` + scriptTag;
            }
            content = content.replace(scriptMatch[0], scriptTag);
        }
    }

    // Fix index.html inline JS
    if (filename === 'index.html') {
        content = content.replace(/ onclick="toggleMenu\(\)"/g, '');
        const indexJsPath = path.join(baseDir, 'js', 'index.js');
        if (fs.existsSync(indexJsPath)) {
            let js = fs.readFileSync(indexJsPath, 'utf8');
            js += '\n\ndocument.addEventListener("DOMContentLoaded", () => {\n  const btn = document.getElementById("hamburger");\n  if (btn) btn.addEventListener("click", toggleMenu);\n});\n';
            fs.writeFileSync(indexJsPath, js, 'utf8');
        }
    }

    // Fix anuncios.html inline JS & CLS
    if (filename === 'anuncios.html') {
        content = content.replace(/\sonclick="[^"]+"/g, '');
        const anunciosJsPath = path.join(baseDir, 'js', 'anuncios.js');
        if (fs.existsSync(anunciosJsPath)) {
            let js = fs.readFileSync(anunciosJsPath, 'utf8');
            js = js.replace('<img src="${foto}" alt="${a.titulo}"', '<img src="${foto}" alt="${a.titulo}" width="360" height="240"');
            js += `

document.addEventListener("DOMContentLoaded", () => {
    const buscadorInput = document.getElementById('buscador');
    const buscarBtn = document.querySelector('.btn-buscar');
    if (buscadorInput) buscadorInput.addEventListener('input', filtrarAnuncios);
    if (buscarBtn) buscarBtn.addEventListener('click', filtrarAnuncios);
    
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            let cat = this.textContent.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]/g, '').trim();
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
    const sidebarCerrar = document.querySelector('.sidebar-cerrar');
    if (sidebarCerrar) sidebarCerrar.addEventListener('click', cerrarFiltros);
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', cerrarFiltros);
});
`;
            fs.writeFileSync(anunciosJsPath, js, 'utf8');
        }
    }

    fs.writeFileSync(filepath, content, 'utf8');
    console.log(filename + " procesado.");
}

fs.mkdirSync(path.join(baseDir, 'css'), { recursive: true });
fs.mkdirSync(path.join(baseDir, 'js'), { recursive: true });

fs.writeFileSync(path.join(baseDir, 'css', 'global.css'), '/* Global CSS */\n', 'utf8');
fs.writeFileSync(path.join(baseDir, 'js', 'global.js'), '/* Global JS */\n', 'utf8');

refactorFile('index.html', 'index.css', 'index.js');
refactorFile('anuncios.html', 'anuncios.css', 'anuncios.js');
refactorFile('alquileres.html', 'alquileres.css', 'alquileres.js');
refactorFile('presupuesto_v2.html', 'presupuesto.css', 'presupuesto.js');
refactorFile('topografia.html', 'topografia.css', 'topografia.js');
refactorFile('aviso-legal.html', 'aviso-legal.css', null);

console.log("Refactorización completada.");
