#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unifica las dos bases de precios del proyecto en una sola fuente de verdad.

Hasta ahora habia dos copias independientes de las mismas 61.447 partidas:
  - pages/gestor-presupuestos.html: datos embebidos (zlib+base64) organizados
    en 17 hojas por oficio (MATERIALES, INSTALACIONES, CARPINTERIA, ...).
  - data/base-precios.json: mismas partidas en un array plano, SIN oficio.

Este script:
  1. Lee la clasificacion por oficio ya curada en el gestor (hoja de cada
     codigo BC3) y la vuelca en data/base-precios.json como campo "grupo".
  2. Convierte data/base-precios.json en la UNICA fuente de verdad: a partir
     de ahora, para anadir/corregir partidas basta con editar ese JSON.
  3. Regenera el bloque embebido de pages/gestor-presupuestos.html a partir
     de ese mismo JSON (agrupando por "grupo"), en vez de mantener una copia
     manual aparte.
  4. Regenera las versiones comprimidas .gz / .br de base-precios.json.

Uso:
  python scripts/unificar-bases-precios.py
"""

import re
import json
import base64
import zlib
import gzip

GESTOR_PATH = 'pages/gestor-presupuestos.html'
JSON_PATH = 'data/base-precios.json'


def cargar_embebido_gestor(html_text):
    m = re.search(r'DATA_B64\s*=\s*"(.*?)";', html_text, re.DOTALL)
    if not m:
        raise ValueError('No se encontro DATA_B64 en el gestor')
    data = json.loads(zlib.decompress(base64.b64decode(m.group(1))).decode('utf-8'))
    return data, m


def main():
    print('[1/6] Leyendo clasificacion por oficio del gestor...')
    with open(GESTOR_PATH, 'r', encoding='utf-8') as f:
        html_gestor = f.read()
    gestor, m = cargar_embebido_gestor(html_gestor)

    sheet_of = {}
    for sheet, rows in gestor.items():
        for r in rows:
            sheet_of[r[0]] = sheet
    print(f'      {len(sheet_of):,} codigos clasificados en {len(gestor)} hojas')

    print(f'[2/6] Leyendo {JSON_PATH}...')
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        partidas = json.load(f)
    print(f'      {len(partidas):,} partidas')

    print('[3/6] Anadiendo campo "grupo" segun la clasificacion del gestor...')
    sin_grupo = 0
    for p in partidas:
        grupo = sheet_of.get(p['cod'])
        if grupo:
            p['grupo'] = grupo
        else:
            sin_grupo += 1
    print(f'      Sin grupo (codigo no encontrado en el gestor): {sin_grupo:,}')

    print(f'[4/6] Guardando {JSON_PATH} unificado...')
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(partidas, f, ensure_ascii=False, separators=(',', ':'))

    print('[5/6] Regenerando versiones comprimidas (.gz / .br)...')
    with open(JSON_PATH, 'rb') as f:
        raw = f.read()
    with open(JSON_PATH + '.gz', 'wb') as f:
        f.write(gzip.compress(raw, compresslevel=9))
    try:
        import brotli
        with open(JSON_PATH + '.br', 'wb') as f:
            f.write(brotli.compress(raw, quality=11))
        print('      .gz y .br regenerados')
    except ImportError:
        print('      AVISO: modulo "brotli" no disponible, .br NO se ha regenerado')
        print('      Instala con: pip install brotli')

    print(f'[6/6] Regenerando {GESTOR_PATH} a partir del JSON unificado...')
    nuevas_hojas = {}
    for p in partidas:
        grupo = p.get('grupo', 'MATERIALES')
        fila = [p['cod'], p.get('uni', ''), p.get('res', ''), p.get('precio', 0)]
        if p.get('desc'):
            fila.append(p['desc'])
        nuevas_hojas.setdefault(grupo, []).append(fila)

    for hoja in nuevas_hojas:
        nuevas_hojas[hoja] = sorted(nuevas_hojas[hoja], key=lambda r: r[0])

    total_antes = sum(len(v) for v in gestor.values())
    total_despues = sum(len(v) for v in nuevas_hojas.values())
    assert total_antes == total_despues, (
        f'Se ha perdido o duplicado alguna partida! antes={total_antes} despues={total_despues}'
    )

    data_json = json.dumps(nuevas_hojas, ensure_ascii=False, separators=(',', ':'))
    compressed = zlib.compress(data_json.encode('utf-8'), level=9)
    b64 = base64.b64encode(compressed).decode('ascii')
    html_final = html_gestor[:m.start(1)] + b64 + html_gestor[m.end(1):]
    with open(GESTOR_PATH, 'w', encoding='utf-8') as f:
        f.write(html_final)

    print(f'      Total partidas: {total_despues:,} en {len(nuevas_hojas)} hojas (sin cambios respecto al original)')
    print(f'      Tamano HTML final: {len(html_final) / 1024 / 1024:.2f} MB')
    print('\nHecho. data/base-precios.json es ahora la unica fuente de verdad.')
    print('Recuerda: si vuelves a ejecutar este script tras editar el JSON a mano,')
    print('el gestor se regenerara correctamente porque usa el campo "grupo" del JSON.')


if __name__ == '__main__':
    main()
