#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enriquece data/base-precios.json (la fuente de verdad unica, ver
unificar-bases-precios.py) con datos reales extraidos del banco de precios
BC3 original (data/BCEXTREM26.bc3, formato FIEBDC-3):

  - capitulo / subcapitulo: jerarquia real de capitulos del banco de
    precios (15 grandes bloques: Mano de obra, Maquinaria, Precios
    simples, Auxiliares, Edificacion, Urbanizacion, Seguridad y salud,
    Rehabilitacion energetica, etc.), mucho mas fiable que la
    reclasificacion manual por "oficio" que ya tiene el campo "grupo".
  - desc: rellena descripcion cuando faltaba, usando el texto (~T) del bc3.
  - descomposicion: para las partidas compuestas (~39% del total), el
    desglose real de recursos (mano de obra, maquinaria, materiales) que
    forman su precio, en data/precios-con-desgloses.json (fichero aparte
    para no engordar el JSON principal que descarga la calculadora; ya
    estaba en .gitignore de un intento anterior, así que no se sube a git).

El fichero .bc3 no esta versionado en git (ver .gitignore, *.bc3) porque
pesa ~18 MB; hay que colocarlo en data/BCEXTREM26.bc3 antes de ejecutar
este script.

Uso:
  python scripts/enriquecer-base-precios.py
"""

import sys
import json
import gzip

sys.path.insert(0, 'scripts')
from parsear_bc3 import parse_bc3, construir_jerarquia, ruta_capitulos, es_capitulo

BC3_PATH = 'data/BCEXTREM26.bc3'
JSON_PATH = 'data/base-precios.json'
DESCOMP_PATH = 'data/precios-con-desgloses.json'


def main():
    print(f'[1/6] Parseando {BC3_PATH}...')
    conceptos, decomp, textos = parse_bc3(BC3_PATH)
    print(f'      {len(conceptos):,} conceptos, {len(decomp):,} descomposiciones, {len(textos):,} textos')

    print('[2/6] Construyendo jerarquia de capitulos...')
    parent_of = construir_jerarquia(conceptos, decomp)
    raiz = [c for c in conceptos if es_capitulo(c) and c not in parent_of]
    nombre_raiz = conceptos[raiz[0]][1] if raiz else None
    print(f'      Raiz: {nombre_raiz!r}')

    print(f'[3/6] Leyendo {JSON_PATH}...')
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        partidas = json.load(f)
    print(f'      {len(partidas):,} partidas')

    print('[4/6] Anadiendo capitulo/subcapitulo, completando descripciones...')
    con_capitulo = 0
    desc_rellenada = 0
    descomposiciones = {}

    for p in partidas:
        cod = p['cod']
        if cod not in conceptos:
            continue

        ruta = ruta_capitulos(cod, parent_of, conceptos)
        if ruta and ruta[0] == nombre_raiz:
            ruta = ruta[1:]
        if ruta:
            p['capitulo'] = ruta[0]
            if len(ruta) > 1:
                p['subcapitulo'] = ' > '.join(ruta[1:])
            con_capitulo += 1

        if not p.get('desc') and cod in textos:
            p['desc'] = textos[cod]
            desc_rellenada += 1

        if cod in decomp:
            recursos = []
            for hijo_cod, f1, cantidad in decomp[cod]:
                if hijo_cod not in conceptos:
                    continue
                uni_r, res_r, precio_r = conceptos[hijo_cod]
                recursos.append({
                    'cod': hijo_cod,
                    'uni': uni_r,
                    'res': res_r,
                    'precio': precio_r,
                    'cantidad': cantidad,
                    'importe': round(precio_r * cantidad, 4),
                })
            if recursos:
                descomposiciones[cod] = recursos

    print(f'      Partidas con capitulo real: {con_capitulo:,} / {len(partidas):,}')
    print(f'      Descripciones completadas: {desc_rellenada:,}')
    print(f'      Partidas con desglose de precio: {len(descomposiciones):,}')

    print(f'[5/6] Guardando {JSON_PATH}...')
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(partidas, f, ensure_ascii=False, separators=(',', ':'))
    with open(JSON_PATH, 'rb') as f:
        raw = f.read()
    with open(JSON_PATH + '.gz', 'wb') as f:
        f.write(gzip.compress(raw, compresslevel=9))
    try:
        import brotli
        with open(JSON_PATH + '.br', 'wb') as f:
            f.write(brotli.compress(raw, quality=11))
    except ImportError:
        print('      AVISO: modulo "brotli" no disponible, .br no regenerado')
    print(f'      {JSON_PATH}: {len(raw) / 1024 / 1024:.1f} MB')

    print(f'[6/6] Guardando {DESCOMP_PATH}...')
    with open(DESCOMP_PATH, 'w', encoding='utf-8') as f:
        json.dump(descomposiciones, f, ensure_ascii=False, separators=(',', ':'))
    with open(DESCOMP_PATH, 'rb') as f:
        raw_d = f.read()
    with open(DESCOMP_PATH + '.gz', 'wb') as f:
        f.write(gzip.compress(raw_d, compresslevel=9))
    try:
        import brotli
        with open(DESCOMP_PATH + '.br', 'wb') as f:
            f.write(brotli.compress(raw_d, quality=11))
    except ImportError:
        pass
    print(f'      {DESCOMP_PATH}: {len(raw_d) / 1024 / 1024:.1f} MB')

    print('\nHecho.')


if __name__ == '__main__':
    main()
