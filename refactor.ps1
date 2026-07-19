$ErrorActionPreference = "Stop"
$baseDir = "f:\obratudela"

function Refactor-File {
    param (
        [string]$filename,
        [string]$cssFilename,
        [string]$jsFilename
    )
    $filepath = Join-Path $baseDir $filename
    if (-not (Test-Path $filepath)) { return }

    $content = [System.IO.File]::ReadAllText($filepath, [System.Text.Encoding]::UTF8)

    # Extract CSS
    if ($content -match '(?s)<style>([\s\S]*?)</style>') {
        $css = $matches[1].Trim()
        $css = $css -replace "url\('fonts/", "url('../fonts/"
        $css = $css -replace "url\('img/", "url('../img/"

        $cssDir = Join-Path $baseDir "css"
        if (-not (Test-Path $cssDir)) { New-Item -ItemType Directory -Path $cssDir | Out-Null }
        [System.IO.File]::WriteAllText((Join-Path $cssDir $cssFilename), $css, [System.Text.Encoding]::UTF8)

        $linkTag = "<link rel=`"stylesheet`" href=`"css/$cssFilename`">"
        if ($content -notmatch 'global\.css') {
            $linkTag = "<link rel=`"stylesheet`" href=`"css/global.css`">`n  $linkTag"
        }
        $content = $content.Replace($matches[0], $linkTag)
    }

    # Extract JS
    if ($jsFilename -and $content -match '(?s)<script>([\s\S]*?)</script>') {
        $js = $matches[1].Trim()

        $jsDir = Join-Path $baseDir "js"
        if (-not (Test-Path $jsDir)) { New-Item -ItemType Directory -Path $jsDir | Out-Null }
        
        # Remove empty schema generation or keep it
        [System.IO.File]::WriteAllText((Join-Path $jsDir $jsFilename), $js, [System.Text.Encoding]::UTF8)

        $scriptTag = "<script src=`"js/$jsFilename`" defer></script>"
        if ($content -notmatch 'global\.js') {
            $scriptTag = "<script src=`"js/global.js`" defer></script>`n$scriptTag"
        }
        
        # Exclude the schema script block from extraction if it's there, but wait, anuncios.html has two script blocks!
        # First one is type="application/ld+json", we should NOT match that!
        # The regex above matches the first <script> without type! Wait, (?s)<script>(.*?)</script> matches exactly `<script>`. The JSON-LD is `<script type="application/ld+json">`. So it's safe.
        $content = $content.Replace($matches[0], $scriptTag)
    }

    # Fix anuncios.html inline JS & CLS
    if ($filename -eq 'anuncios.html') {
        $content = $content -replace '\sonclick="[^"]+"', ''
        
        $anunciosJsPath = Join-Path $baseDir "js\anuncios.js"
        if (Test-Path $anunciosJsPath) {
            $js = [System.IO.File]::ReadAllText($anunciosJsPath, [System.Text.Encoding]::UTF8)
            $js = $js.Replace('<img src="${foto}" alt="${a.titulo}"', '<img src="${foto}" alt="${a.titulo}" width="360" height="240"')
            
            $js += @"

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
    const sidebarCerrar = document.querySelector('.sidebar-cerrar');
    if (sidebarCerrar) sidebarCerrar.addEventListener('click', cerrarFiltros);
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', cerrarFiltros);
});
"@
            [System.IO.File]::WriteAllText($anunciosJsPath, $js, [System.Text.Encoding]::UTF8)
        }
    }

    [System.IO.File]::WriteAllText($filepath, $content, [System.Text.Encoding]::UTF8)
    Write-Host "$filename procesado."
}

Refactor-File 'anuncios.html' 'anuncios.css' 'anuncios.js'
Refactor-File 'alquileres.html' 'alquileres.css' 'alquileres.js'
Refactor-File 'presupuesto_v2.html' 'presupuesto.css' 'presupuesto.js'
Refactor-File 'topografia.html' 'topografia.css' 'topografia.js'
Refactor-File 'aviso-legal.html' 'aviso-legal.css' ''

Write-Host "Refactorizacion completada."
