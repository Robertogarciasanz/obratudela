#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Corrige un fallo real: la fusion con la base BCEXTREM 2026 (actualizar-gestor-2026.py)
perdio la descripcion larga de decenas de miles de partidas que SI la tenian en el
archivo original, porque:
  1) las partidas "solo en la base antigua" se copiaban sin su campo de descripcion.
  2) las partidas comunes a ambas bases usaban la descripcion de la base 2026 SIN
     recurrir a la antigua cuando la 2026 no traia ninguna.

Este script recupera, para cada codigo de la base ACTUAL que se quedo sin descripcion,
la descripcion que tenia en el archivo original (commit 8029939), sin tocar precios,
unidades, resumenes ni la categoria en la que quedo tras la reclasificacion por oficios.
"""

import re
import json
import base64
import zlib
import subprocess

PATH = 'pages/gestor-presupuestos.html'
COMMIT_ORIGINAL = '8029939'  # ultimo commit antes de tocar la base de precios


def cargar_embebido(html_text):
    m = re.search(r'DATA_B64\s*=\s*"(.*?)";', html_text, re.DOTALL)
    binary = base64.b64decode(m.group(1))
    data = json.loads(zlib.decompress(binary).decode('utf-8'))
    return data, m


def main():
    print(f'[1/4] Leyendo version original (commit {COMMIT_ORIGINAL})...')
    html_original = subprocess.run(
        ['git', 'show', f'{COMMIT_ORIGINAL}:{PATH}'],
        capture_output=True, text=True, encoding='utf-8', check=True
    ).stdout
    original, _ = cargar_embebido(html_original)

    desc_original = {}
    for rows in original.values():
        for r in rows:
            if len(r) > 4 and r[4]:
                desc_original[r[0]] = r[4]
    print(f'      {len(desc_original):,} codigos con descripcion en el original')

    print('[2/4] Leyendo base actual...')
    with open(PATH, 'r', encoding='utf-8') as f:
        html_actual = f.read()
    actual, m = cargar_embebido(html_actual)
    total_actual = sum(len(v) for v in actual.values())

    print('[3/4] Recuperando descripciones perdidas...')
    recuperadas = 0
    for sheet, rows in actual.items():
        for r in rows:
            tiene_desc = len(r) > 4 and r[4]
            if not tiene_desc and r[0] in desc_original:
                if len(r) > 4:
                    r[4] = desc_original[r[0]]
                else:
                    r.append(desc_original[r[0]])
                recuperadas += 1
    print(f'      {recuperadas:,} descripciones recuperadas')

    total_final = sum(len(v) for v in actual.values())
    con_desc_final = sum(1 for rows in actual.values() for r in rows if len(r) > 4 and r[4])
    assert total_final == total_actual, 'Se ha alterado el numero de partidas!'
    print(f'\n      Total partidas: {total_final:,} (sin cambios)')
    print(f'      Partidas con descripcion ahora: {con_desc_final:,} de {total_final:,} ({100*con_desc_final/total_final:.1f}%)')

    print('[4/4] Guardando...')
    data_json = json.dumps(actual, ensure_ascii=False, separators=(',', ':'))
    compressed = zlib.compress(data_json.encode('utf-8'), level=9)
    b64 = base64.b64encode(compressed).decode('ascii')
    html_final = html_actual[:m.start(1)] + b64 + html_actual[m.end(1):]
    with open(PATH, 'w', encoding='utf-8') as f:
        f.write(html_final)
    print(f'      Hecho. Tamano HTML: {len(html_final)/1024/1024:.2f} MB')


if __name__ == '__main__':
    main()
