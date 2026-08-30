#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Reclasifica partidas mal archivadas dentro de gestor-presupuestos.html,
usando el sub-prefijo del codigo BC3 (letra + 2 digitos, o el prefijo
numerico de 2 digitos) para determinar el oficio real de cada partida.

Basado en muestreo de contenido real (ver conversacion), NO en el codigo
generico D0x/U0x de otras bases de precios (esos codigos no existen aqui).
"""

import re
import json
import base64
import zlib

PATH = 'pages/gestor-presupuestos.html'


def subgrupo(cod):
    m = re.match(r'^([A-Za-z]+)(\d{2})', cod)
    if m:
        return m.group(1) + m.group(2)
    return cod[:3]


# sheet_origen -> {subgrupo: sheet_destino}
REGLAS = {
    'E1': {
        # Carpinteria: puertas, ventanas, vidrios
        'E13': 'CARPINTERIA', 'E14': 'CARPINTERIA', 'E29': 'CARPINTERIA',
        '12N': 'CARPINTERIA', '12A': 'CARPINTERIA', '12L': 'CARPINTERIA',
        '12W': 'CARPINTERIA', '12V': 'CARPINTERIA', '12S': 'CARPINTERIA',
        # Instalaciones: electricidad, fontaneria, saneamiento, gas, ventilacion
        'E12': 'INSTALACIONES', 'E03': 'INSTALACIONES', 'E17': 'INSTALACIONES',
        'E23': 'INSTALACIONES', 'E21': 'INSTALACIONES', 'E19': 'INSTALACIONES',
        '04E': 'INSTALACIONES', '04V': 'INSTALACIONES', '04C': 'INSTALACIONES',
        '04W': 'INSTALACIONES', '04R': 'INSTALACIONES', 'PM22': 'INSTALACIONES',
        # Revestimientos / acabados
        'E10': 'R0', 'E11': 'R0', 'E08': 'R0', 'E15': 'R0', 'E16': 'R0',
        '13I': 'R0', '13S': 'R0', '13E': 'R0', '14M': 'R0', '14W': 'R0',
        # Aislamiento
        'E09': 'AISLAMIENTO',
        # Seguridad y salud
        '19S': 'SEGURIDAD', '19L': 'SEGURIDAD', '19W': 'SEGURIDAD',
        # Movimiento de tierras
        'E02': 'MOVTIERRA',
        # Demolicion
        'E01': 'DEMOLICION', 'D01': 'DEMOLICION',
        # el resto (E04,E05,E06,E07,E18,03H,03C,03E,03A,03R,03W...) se queda en E1 = Estructura
    },
    'DEMOLICION': {
        # Rehabilitacion / reparaciones (NO son demoliciones)
        'Q08': 'R0', 'Q06': 'R0', 'Q04': 'R0', 'Q07': 'R0', 'Q03': 'R0', 'Q11': 'R0',
        # Aislamiento
        'Q05': 'AISLAMIENTO',
        # Carpinteria (sustitucion de puertas/ventanas)
        'Q10': 'CARPINTERIA',
        # Instalaciones (sustitucion electricidad / fontaneria)
        'Q09': 'INSTALACIONES', 'Q02': 'INSTALACIONES',
        # el resto (Q01,01R,01I,01Q,01A,01C,01K,01E,01U,01X,01S,01T) se queda = demolicion real
    },
    'U0': {
        'U09': 'JARDINERIA', 'U12': 'JARDINERIA',
    },
}


def main():
    with open(PATH, 'r', encoding='utf-8') as f:
        html = f.read()
    m = re.search(r'DATA_B64\s*=\s*"(.*?)";', html, re.DOTALL)
    data = json.loads(zlib.decompress(base64.b64decode(m.group(1))).decode('utf-8'))

    total_antes = sum(len(v) for v in data.values())
    movidos = 0

    for sheet_origen, reglas in REGLAS.items():
        origen = data.get(sheet_origen, [])
        quedan = []
        for r in origen:
            sg = subgrupo(r[0])
            destino = reglas.get(sg)
            if destino:
                data.setdefault(destino, []).append(r)
                movidos += 1
            else:
                quedan.append(r)
        data[sheet_origen] = quedan

    for sheet in data:
        data[sheet] = sorted(data[sheet], key=lambda r: r[0])

    total_despues = sum(len(v) for v in data.values())
    print(f'Partidas movidas: {movidos}')
    print(f'Total antes: {total_antes}  Total despues: {total_despues}')
    assert total_antes == total_despues, 'Se ha perdido o duplicado alguna partida!'

    print('\nRecuento final por categoria:')
    for sheet, rows in sorted(data.items(), key=lambda kv: -len(kv[1])):
        print(f'  {sheet}: {len(rows):,}')

    data_json = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    compressed = zlib.compress(data_json.encode('utf-8'), level=9)
    b64 = base64.b64encode(compressed).decode('ascii')
    html_final = html[:m.start(1)] + b64 + html[m.end(1):]
    with open(PATH, 'w', encoding='utf-8') as f:
        f.write(html_final)
    print(f'\nHTML actualizado, tamano MB: {len(html_final)/1024/1024:.2f}')


if __name__ == '__main__':
    main()
