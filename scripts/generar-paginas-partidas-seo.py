#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador de páginas HTML estáticas para partidas populares (SEO)
Cada partida tendrá su propia página para posicionar en Google
"""

import json
import os
import re
from pathlib import Path

# Partidas más buscadas / populares para generar páginas SEO
PARTIDAS_POPULARES = [
    "DEMOLICION",
    "EXCAVACION",
    "MURO",
    "LADRILLO",
    "BORDILLO",
    "ACERA",
    "PAVIMENTO",
    "HORMIGON",
    "JARDIN",
    "CESPED",
    "RIEGO",
    "FONTANERIA",
    "ELECTRICIDAD",
    "VENTANA",
    "PUERTA"
]

def limpiar_para_url(texto):
    """Convierte texto a URL amigable"""
    texto = texto.lower()
    texto = re.sub(r'[áàâä]', 'a', texto)
    texto = re.sub(r'[éèêë]', 'e', texto)
    texto = re.sub(r'[íìîï]', 'i', texto)
    texto = re.sub(r'[óòôö]', 'o', texto)
    texto = re.sub(r'[úùûü]', 'u', texto)
    texto = re.sub(r'ñ', 'n', texto)
    texto = re.sub(r'[^a-z0-9]+', '-', texto)
    texto = texto.strip('-')
    return texto

def generar_html_partida(partidas, palabra_clave):
    """Genera HTML para una página de partidas relacionadas"""

    url_palabra = limpiar_para_url(palabra_clave)
    total = len(partidas)

    # Calcular precio promedio
    precios = [p['precio'] for p in partidas if p['precio'] > 0]
    precio_min = min(precios) if precios else 0
    precio_max = max(precios) if precios else 0
    precio_med = sum(precios) / len(precios) if precios else 0

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Precio {palabra_clave.title()} | {total} Partidas | ObraTudela</title>
    <meta name="description" content="✅ Precios de {palabra_clave.lower()} actualizados 2026. {total} partidas con precios desde {precio_min:.2f}€. Base de datos oficial BCEXTREM. Calculadora gratis.">
    <meta name="keywords" content="precio {palabra_clave.lower()}, partida {palabra_clave.lower()}, presupuesto {palabra_clave.lower()}, {palabra_clave.lower()} precio m2, {palabra_clave.lower()} precio m3">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://www.obratudela.com/partidas/{url_palabra}.html">
    <link rel="icon" href="../img/logo.jpg" type="image/jpeg">
    <link rel="stylesheet" href="../css/global.css">

    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Precios de {palabra_clave.title()} - Base de Datos Oficial",
        "description": "Base de precios actualizada 2026 con {total} partidas relacionadas con {palabra_clave.lower()}. Desde {precio_min:.2f}€ hasta {precio_max:.2f}€.",
        "url": "https://www.obratudela.com/partidas/{url_palabra}.html",
        "mainEntity": {{
            "@type": "ItemList",
            "numberOfItems": {total},
            "itemListElement": [
"""

    # Añadir primeras 10 partidas al schema
    for i, partida in enumerate(partidas[:10], 1):
        html += f"""
                {{
                    "@type": "ListItem",
                    "position": {i},
                    "item": {{
                        "@type": "Product",
                        "name": "{partida['res'][:100]}",
                        "sku": "{partida['cod']}",
                        "offers": {{
                            "@type": "Offer",
                            "price": "{partida['precio']:.2f}",
                            "priceCurrency": "EUR"
                        }}
                    }}
                }}{"," if i < min(10, len(partidas)) else ""}"""

    html += """
            ]
        },
        "provider": {
            "@type": "Organization",
            "name": "Excavaciones y Servicios Arturo S.L.",
            "url": "https://www.obratudela.com"
        }
    }
    </script>

    <style>
        body { font-family: 'Open Sans', sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #ff6b00; font-size: 2.5rem; margin-bottom: 10px; }
        .stats { background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .stat-item { text-align: center; }
        .stat-value { font-size: 2rem; font-weight: bold; color: #ff6b00; }
        .stat-label { color: #666; font-size: 0.9rem; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #ff6b00; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:hover { background: #f9f9f9; }
        .cta { background: #ff6b00; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0; font-weight: bold; }
        .cta:hover { background: #e05e00; }
        .breadcrumb { margin: 20px 0; color: #666; font-size: 0.9rem; }
        .breadcrumb a { color: #ff6b00; text-decoration: none; }
    </style>
</head>
<body>
    <div class="breadcrumb">
        <a href="../index.html">Inicio</a> ›
        <a href="../pages/calculadora-profesional.html">Calculadora</a> ›
        <strong>"""

    html += palabra_clave.title()
    html += """</strong>
    </div>

    <h1>📊 Precios de """
    html += palabra_clave.title()
    html += f""" 2026</h1>

    <p style="font-size: 1.2rem; color: #666;">
        Base de datos oficial BCEXTREM con <strong>{total} partidas</strong> relacionadas con {palabra_clave.lower()}.
        Precios actualizados y verificados.
    </p>

    <div class="stats">
        <h2>📈 Estadísticas de Precios</h2>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">{total}</div>
                <div class="stat-label">Partidas Disponibles</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">{precio_min:.2f}€</div>
                <div class="stat-label">Precio Mínimo</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">{precio_max:.2f}€</div>
                <div class="stat-label">Precio Máximo</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">{precio_med:.2f}€</div>
                <div class="stat-label">Precio Medio</div>
            </div>
        </div>
    </div>

    <a href="../pages/calculadora-profesional.html" class="cta">
        🧮 Crear Presupuesto Gratis
    </a>

    <h2>📋 Listado Completo de Partidas</h2>

    <table>
        <thead>
            <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Unidad</th>
                <th>Precio</th>
            </tr>
        </thead>
        <tbody>
"""

    # Añadir todas las partidas
    for partida in partidas:
        html += f"""
            <tr>
                <td><strong>{partida['cod']}</strong></td>
                <td>{partida['res']}</td>
                <td>{partida['uni']}</td>
                <td><strong>{partida['precio']:.2f} €</strong></td>
            </tr>
"""

    html += """
        </tbody>
    </table>

    <div style="margin: 40px 0; padding: 20px; background: #f4f4f4; border-radius: 8px;">
        <h3>💡 ¿Necesitas crear un presupuesto?</h3>
        <p>Utiliza nuestra <a href="../pages/calculadora-profesional.html" style="color: #ff6b00; font-weight: bold;">calculadora gratuita</a> con acceso a 46,000+ partidas de construcción.</p>
        <ul>
            <li>✅ Base de datos BCEXTREM 2026 actualizada</li>
            <li>✅ Exporta a Excel y BC3 (Presto/Arquímedes)</li>
            <li>✅ Gestión de proyectos</li>
            <li>✅ 100% Gratis, sin registro</li>
        </ul>
        <a href="../pages/calculadora-profesional.html" class="cta">Crear Presupuesto Ahora</a>
    </div>

    <footer style="text-align: center; padding: 40px 0; color: #666; border-top: 1px solid #ddd; margin-top: 40px;">
        <p><strong>Excavaciones y Servicios Arturo S.L.</strong></p>
        <p>Tudela de Duero, Valladolid | <a href="tel:+34607444903" style="color: #ff6b00;">📞 607 444 903</a></p>
        <p><a href="https://www.obratudela.com" style="color: #ff6b00;">www.obratudela.com</a></p>
    </footer>
</body>
</html>
"""

    return html

# Cargar base de datos
print("Cargando base de datos...")
with open('../data/base-precios.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

print(f"Total partidas: {len(db)}")

# Crear directorio de partidas
partidas_dir = Path('../partidas')
partidas_dir.mkdir(exist_ok=True)

print(f"\nGenerando páginas HTML...")

paginas_generadas = []

for palabra in PARTIDAS_POPULARES:
    # Buscar partidas que contengan la palabra
    partidas_relacionadas = [
        p for p in db
        if palabra.upper() in p['res'].upper()
    ]

    if len(partidas_relacionadas) < 5:
        print(f"  SKIP {palabra}: Solo {len(partidas_relacionadas)} partidas (omitido)")
        continue

    # Generar HTML
    html = generar_html_partida(partidas_relacionadas, palabra)

    # Guardar archivo
    url_palabra = limpiar_para_url(palabra)
    archivo = partidas_dir / f"{url_palabra}.html"

    with open(archivo, 'w', encoding='utf-8') as f:
        f.write(html)

    paginas_generadas.append({
        'palabra': palabra,
        'url': url_palabra,
        'partidas': len(partidas_relacionadas)
    })

    print(f"  OK {palabra}: {len(partidas_relacionadas)} partidas -> {url_palabra}.html")

print(f"\nOK {len(paginas_generadas)} paginas generadas en /partidas/")
print("\nPáginas creadas:")
for pag in paginas_generadas:
    print(f"  • https://www.obratudela.com/partidas/{pag['url']}.html ({pag['partidas']} partidas)")
