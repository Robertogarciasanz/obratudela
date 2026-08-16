#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Inyectar precios-combinado.json en gestor-presupuestos.html
Regenera el blob DATA_B64 con las partidas unificadas BCEXTREM + BCCA
"""

import json
import zlib
import base64
import sys

# ── Mapeo de prefijos de código a hojas del gestor ──────────────────────────
# BCEXTREM usa prefijos de código para categorizar
SHEET_MAP = {
    'A': 'A0',          # Auxiliares
    'C': 'C0',          # Control calidad
    'E': 'E1',          # Edificación / Estructura
    'N': 'N0',          # Aislamiento
    'R': 'R0',          # Rehabilitación / Revestimientos
    'U': 'U0',          # Urbanización
    '%': 'A0',          # Medios auxiliares (porcentajes)
}

# Categorías especiales por palabra clave en resumen
KEYWORD_SHEETS = [
    ('JARDINERIA', ['jardin', 'arbol', 'arbol', 'césped', 'cesped', 'plant', 'poda', 'siembra', 'forestal']),
    ('DEMOLICION', ['demoli', 'derribo', 'desescombr']),
    ('CARGA', ['residuo', 'escombro', 'vertedero', 'gestor', 'carga y transporte']),
    ('SEGURIDAD', ['seguridad', 'salud', 'epi ', 'casco', 'señaliz']),
    ('MAQUINARIA', ['excava', 'retroexcav', 'bulldozer', 'dozer', 'dumper', 'grua', 'pala carg', 'compresor']),
    ('MANO DE OBRA', ['peon', 'peón', 'oficial', 'ayudante', 'capataz', 'encargado', 'topograf']),
    ('MATERIALES', ['cemento', 'hormigon', 'hormigón', 'arena', 'grava', 'agua', 'acero', 'madera']),
    ('AISLAMIENTO', ['aislam', 'impermeab', 'lana roca', 'poliuretano', 'xps', 'eps']),
]


def guess_sheet(item):
    cod = item.get('cod', '')
    res = item.get('res', '').lower()

    # Primero por palabra clave en resumen
    for sheet, keywords in KEYWORD_SHEETS:
        for kw in keywords:
            if kw in res:
                return sheet

    # Por prefijo de código
    prefix = cod[0].upper() if cod else ''
    if prefix in SHEET_MAP:
        return SHEET_MAP[prefix]

    # BCCA tiene códigos numéricos
    if cod.startswith('BCCA_'):
        inner = cod[5:]  # sin 'BCCA_'
        if inner[:2] in ('01', '02'):
            return 'DEMOLICION'
        if inner[:2] in ('03', '04', '05'):
            return 'E1'
        if inner[:2] in ('06',):
            return 'R0'
        if inner[:2] in ('07',):
            return 'U0'
        return 'E1'  # default BCCA → Edificación

    return 'E1'  # fallback


def main():
    print("[INFO] Cargando precios-combinado.json...")
    with open('precios-combinado.json', 'r', encoding='utf-8') as f:
        partidas = json.load(f)
    print(f"[OK] {len(partidas)} partidas cargadas")

    # Construir estructura de hojas
    sheets = {
        'A0': [], 'C0': [], 'E1': [], 'JARDINERIA': [], 'CARGA': [],
        'AISLAMIENTO': [], 'N0': [], 'MAQUINARIA': [], 'MANO DE OBRA': [],
        'MATERIALES': [], 'DEMOLICION': [], 'R0': [], 'SEGURIDAD': [], 'U0': []
    }

    sin_precio = 0
    for item in partidas:
        precio = item.get('precio', 0.0)
        if precio is None or precio <= 0:
            sin_precio += 1
            continue  # omitir sin precio útil

        sheet = guess_sheet(item)
        row = [
            item.get('cod', ''),
            item.get('uni', ''),
            item.get('res', ''),
            float(precio)
        ]
        sheets[sheet].append(row)

    total = sum(len(v) for v in sheets.items() if isinstance(v, list))
    # corrección: sum correcta
    total = sum(len(rows) for rows in sheets.values())

    print(f"[INFO] Distribución por hoja:")
    for sheet, rows in sheets.items():
        print(f"  {sheet:15s}: {len(rows):6,} partidas")
    print(f"  {'TOTAL':15s}: {total:6,} partidas")
    print(f"  Sin precio (omitidas): {sin_precio}")

    # Serializar y comprimir
    print("\n[INFO] Comprimiendo...")
    raw_json = json.dumps(sheets, ensure_ascii=False, separators=(',', ':'))
    raw_bytes = raw_json.encode('utf-8')
    compressed = zlib.compress(raw_bytes, level=9)  # wbits=15 (zlib)
    b64 = base64.b64encode(compressed).decode('ascii')

    print(f"[OK] JSON original: {len(raw_bytes)/1024/1024:.2f} MB")
    print(f"[OK] Comprimido:    {len(compressed)/1024:.1f} KB")
    print(f"[OK] Base64:        {len(b64)/1024:.1f} KB")

    # Leer gestor-presupuestos.html
    print("\n[INFO] Leyendo gestor-presupuestos.html...")
    with open('gestor-presupuestos.html', 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    # Localizar DATA_B64
    marker = 'const DATA_B64 = '
    start = content.index(marker) + len(marker)
    quote_char = content[start]
    end = content.index(quote_char, start + 1)

    old_b64_len = end - start - 1
    print(f"[INFO] Blob antiguo: {old_b64_len/1024:.1f} KB")

    # Sustituir
    new_content = content[:start] + quote_char + b64 + quote_char + content[end+1:]

    # Actualizar textos de conteo en el HTML
    new_content = new_content.replace(
        'BASE DE PRECIOS · ${total.toLocaleString(\'es-ES\')} PARTIDAS',
        'BASE DE PRECIOS · ${total.toLocaleString(\'es-ES\')} PARTIDAS'
    )

    # Guardar
    print("[INFO] Guardando gestor-presupuestos.html...")
    with open('gestor-presupuestos.html', 'w', encoding='utf-8') as f:
        f.write(new_content)

    import os
    size_mb = os.path.getsize('gestor-presupuestos.html') / 1024 / 1024
    print(f"[OK] Guardado. Tamaño: {size_mb:.1f} MB")
    print(f"\n✅ Gestor actualizado con {total:,} partidas (BCEXTREM + BCCA)")


if __name__ == '__main__':
    main()
