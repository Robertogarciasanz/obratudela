#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Actualiza la base de precios embebida en pages/gestor-presupuestos.html
combinando los datos actuales con la nueva base BCEXTREM 2026.

Estrategia:
  - Para cada codigo BC3, si existe en la base nueva (2026), se usa esa version
    (precio y descripcion actualizados, y en su categoria/hoja correcta).
  - Si un codigo solo existe en la base actual (no esta en la 2026), se conserva
    tal cual, en su hoja original, para no perder partidas reales.
  - Encima de todo eso se aplican las correcciones manuales de precios_actualizados.json.

Uso:
  python scripts/actualizar-gestor-2026.py <ruta_html_2026> [ruta_correcciones.json]
"""

import re
import sys
import json
import base64
import zlib
from collections import Counter

GESTOR_PATH = 'pages/gestor-presupuestos.html'

# Mapa de categoria (para partidas "solo en la base actual") a partir del
# prefijo numerico de 2 digitos del codigo BC3, segun la codificacion clasica
# de bancos de precios espanoles.
PREFIX_TO_SHEET = {
    '01': 'DEMOLICION', '02': 'DEMOLICION', '03': 'E1', '04': 'E1',
    '05': 'N0', '06': 'N0', '07': 'AISLAMIENTO', '08': 'MATERIALES',
    '09': 'AISLAMIENTO', '10': 'R0', '11': 'MATERIALES', '15': 'MATERIALES',
    '17': 'CARGA', '18': 'C0', '21': 'MATERIALES',
}


def load_embedded(html_text):
    m = re.search(r'DATA_B64\s*=\s*"(.*?)";', html_text, re.DOTALL)
    if not m:
        raise ValueError('No se encontro DATA_B64 en el HTML')
    binary = base64.b64decode(m.group(1))
    try:
        raw = zlib.decompress(binary)
    except zlib.error:
        import gzip
        raw = gzip.decompress(binary)
    return json.loads(raw.decode('utf-8')), (m.start(1), m.end(1))


def parse_precio(value):
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).replace('€', '').strip()
    s = s.replace('.', '').replace(',', '.') if ',' in s else s
    try:
        return float(s)
    except ValueError:
        return 0.0


def clean_text(s):
    if not s:
        return ''
    return re.sub(r'\s+', ' ', s).strip()


def main():
    if len(sys.argv) < 2:
        print('Uso: python scripts/actualizar-gestor-2026.py <ruta_html_2026> [correcciones.json]')
        sys.exit(1)

    nuevo_path = sys.argv[1]
    correcciones_path = sys.argv[2] if len(sys.argv) > 2 else None

    print(f'[1/6] Leyendo base actual ({GESTOR_PATH})...')
    with open(GESTOR_PATH, 'r', encoding='utf-8') as f:
        html_actual = f.read()
    live, span = load_embedded(html_actual)
    live_total = sum(len(v) for v in live.values())
    print(f'      {live_total:,} partidas en {len(live)} hojas')

    print(f'[2/6] Leyendo base nueva ({nuevo_path})...')
    with open(nuevo_path, 'r', encoding='utf-8') as f:
        html_nuevo = f.read()
    nuevo, _ = load_embedded(html_nuevo)
    nuevo_total = sum(len(v) for v in nuevo.values())
    print(f'      {nuevo_total:,} partidas en {len(nuevo)} hojas')

    print('[3/6] Combinando (2026 tiene prioridad; se conserva lo exclusivo de la actual)...')
    # sheet -> {cod: row}
    merged = {sheet: {} for sheet in live.keys()}
    for sheet in nuevo:
        if sheet not in merged:
            merged[sheet] = {}

    codigo_a_hoja_nueva = {}
    for sheet, rows in nuevo.items():
        for r in rows:
            codigo_a_hoja_nueva[r[0]] = sheet

    for sheet, rows in nuevo.items():
        for r in rows:
            cod, uni, res, precio = r[0], r[1], clean_text(r[2]), r[3]
            desc = clean_text(r[4]) if len(r) > 4 and r[4] else ''
            merged[sheet][cod] = [cod, uni, res, precio] + ([desc] if desc else [])

    solo_actual = 0
    for sheet, rows in live.items():
        for r in rows:
            cod = r[0]
            if cod in codigo_a_hoja_nueva:
                continue  # ya viene de la base nueva, en su hoja correcta
            uni, res, precio = r[1], clean_text(r[2]), r[3]
            prefix = re.match(r'^0?(\d{1,2})', cod)
            destino = sheet
            if prefix:
                destino = PREFIX_TO_SHEET.get(prefix.group(0).zfill(2), sheet)
                if destino not in merged:
                    merged[destino] = {}
            merged[destino][cod] = [cod, uni, res, precio]
            solo_actual += 1
    print(f'      {solo_actual:,} partidas exclusivas de la base actual conservadas')

    correcciones_aplicadas = 0
    if correcciones_path:
        print(f'[4/6] Aplicando correcciones manuales ({correcciones_path})...')
        with open(correcciones_path, 'r', encoding='utf-8') as f:
            correcciones = json.load(f)
        # cod -> hoja, para saber donde esta cada codigo tras el merge
        cod_a_hoja = {}
        for sheet, items in merged.items():
            for cod in items:
                cod_a_hoja[cod] = sheet
        for c in correcciones:
            cod = (c.get('CÓDIGO') or '').strip()
            if not cod:
                continue
            precio = parse_precio(c.get('PRECIO', 0))
            desc = clean_text((c.get('TEXTO DESCRIPTIVO') or '').rstrip('|'))
            uni = c.get('UNIDAD', '')
            res = clean_text(c.get('RESUMEN', ''))
            if cod in cod_a_hoja:
                sheet = cod_a_hoja[cod]
                row = merged[sheet][cod]
                row[3] = precio
                if desc:
                    if len(row) > 4:
                        row[4] = desc
                    else:
                        row.append(desc)
                correcciones_aplicadas += 1
            else:
                sheet = 'MATERIALES'
                merged.setdefault(sheet, {})
                merged[sheet][cod] = [cod, uni, res, precio] + ([desc] if desc else [])
                correcciones_aplicadas += 1
        print(f'      {correcciones_aplicadas:,} correcciones aplicadas')
    else:
        print('[4/6] Sin fichero de correcciones, se omite')

    print('[5/6] Generando estructura final...')
    final = {}
    total_final = 0
    for sheet, items in merged.items():
        rows = sorted(items.values(), key=lambda r: r[0])
        if rows:
            final[sheet] = rows
            total_final += len(rows)
    print(f'      TOTAL: {total_final:,} partidas en {len(final)} hojas')
    for sheet, rows in final.items():
        print(f'        {sheet}: {len(rows):,}')

    print('[6/6] Comprimiendo y actualizando el HTML...')
    data_json = json.dumps(final, ensure_ascii=False, separators=(',', ':'))
    compressed = zlib.compress(data_json.encode('utf-8'), level=9)
    b64 = base64.b64encode(compressed).decode('ascii')

    start, end = span
    html_final = html_actual[:start] + b64 + html_actual[end:]
    with open(GESTOR_PATH, 'w', encoding='utf-8') as f:
        f.write(html_final)

    print(f'      JSON sin comprimir: {len(data_json)/1024/1024:.1f} MB')
    print(f'      Comprimido (zlib): {len(compressed)/1024/1024:.1f} MB')
    print(f'      Tamano final del HTML: {len(html_final)/1024/1024:.1f} MB')
    print('\nHecho.')


if __name__ == '__main__':
    main()
