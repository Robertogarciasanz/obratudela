#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extraer textos largos (~T) de un archivo BC3 y compararlos con base-precios.json
"""

import sys
import json

def parse_bc3_texts(bc3_path):
    """Extrae solo los registros ~T (textos largos) de un BC3"""
    texts = {}

    try:
        with open(bc3_path, 'r', encoding='latin-1', errors='replace') as f:
            content = f.read()
    except:
        try:
            with open(bc3_path, 'r', encoding='cp1252', errors='replace') as f:
                content = f.read()
        except Exception as e:
            print(f"[ERROR] No se pudo leer el archivo: {e}")
            return texts

    # Procesar línea por línea
    lines = content.split('\n')
    buffer = ''
    records = []

    for line in lines:
        trimmed = line.rstrip()
        if not trimmed:
            continue
        if trimmed.endswith('\\'):
            buffer += trimmed[:-1]
            continue
        buffer += trimmed
        if buffer:
            records.append(buffer)
            buffer = ''

    if buffer:
        records.append(buffer)

    print(f"[INFO] Total de registros en BC3: {len(records):,}")

    # Extraer solo registros ~T (textos)
    count_t = 0
    for rec in records:
        rec = rec.strip()
        if len(rec) < 3 or rec[0] != '~':
            continue

        rtype = rec[1]
        if rtype == 'T':
            partes = rec[2:].split('|')
            if len(partes) >= 3:
                code = (partes[1] or '').strip()
                txt = (partes[2] or '').strip()
                if code and txt:
                    texts[code] = txt
                    count_t += 1

    print(f"[INFO] Registros ~T (textos largos) encontrados: {count_t:,}")
    return texts

def main():
    if len(sys.argv) < 2:
        print("Uso: python extraer-textos-bc3.py <archivo.bc3>")
        print("\nEjemplo:")
        print('  python extraer-textos-bc3.py "f:\\presupuestos\\BCEXTGREM_26_v0.bc3"')
        sys.exit(1)

    bc3_path = sys.argv[1]
    print(f"[INFO] Leyendo BC3: {bc3_path}")

    # Extraer textos del BC3
    bc3_texts = parse_bc3_texts(bc3_path)

    # Cargar base-precios.json
    print("\n[INFO] Cargando base-precios.json...")
    with open('base-precios.json', 'r', encoding='utf-8') as f:
        partidas = json.load(f)

    print(f"[INFO] Total partidas en base-precios.json: {len(partidas):,}")

    # Contar cuántas tienen desc
    con_desc = sum(1 for p in partidas if p.get('desc'))
    sin_desc = len(partidas) - con_desc

    print(f"[INFO] Con descripción larga actual: {con_desc:,}")
    print(f"[INFO] Sin descripción larga actual: {sin_desc:,}")

    # Ver cuántos textos del BC3 podemos agregar
    codes_bc3 = set(bc3_texts.keys())
    codes_json = {p['cod'] for p in partidas}

    # Códigos que existen en ambos
    codes_comunes = codes_bc3 & codes_json

    # De los comunes, cuántos NO tienen desc en JSON
    nuevos = 0
    for p in partidas:
        if p['cod'] in codes_comunes and not p.get('desc'):
            nuevos += 1

    print(f"\n[RESULTADO] Códigos en BC3: {len(codes_bc3):,}")
    print(f"[RESULTADO] Códigos en JSON: {len(codes_json):,}")
    print(f"[RESULTADO] Códigos comunes: {len(codes_comunes):,}")
    print(f"[RESULTADO] Textos nuevos que se pueden agregar: {nuevos:,}")

    if nuevos > 0:
        print("\n¿Quieres actualizar base-precios.json con estos textos? (s/n)")
    else:
        print("\n[INFO] No hay textos nuevos para agregar.")
        print("[INFO] El BC3 y base-precios.json ya están sincronizados.")

if __name__ == '__main__':
    main()
