#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Combinar bases de precios JSON
Combina BCEXTREM (Extremadura) con BCCA (Andalucia) eliminando duplicados
"""

import json
import sys

def main():
    print("\n[INFO] Combinando bases de precios...")
    print("[INFO] Base 1: precios.json (BCEXTREM)")
    print("[INFO] Base 2: bcca-andalucia.json (BCCA)")

    # Load BCEXTREM
    try:
        with open('precios.json', 'r', encoding='utf-8') as f:
            bcextrem = json.load(f)
        print(f"[OK] BCEXTREM cargada: {len(bcextrem)} partidas")
    except Exception as e:
        print(f"[ERROR] Error cargando BCEXTREM: {str(e)}")
        sys.exit(1)

    # Load BCCA
    try:
        with open('bcca-andalucia.json', 'r', encoding='utf-8') as f:
            bcca = json.load(f)
        print(f"[OK] BCCA cargada: {len(bcca)} partidas")
    except Exception as e:
        print(f"[ERROR] Error cargando BCCA: {str(e)}")
        sys.exit(1)

    # Create set of existing codes
    codigos_existentes = set()
    for item in bcextrem:
        if 'cod' in item:
            codigos_existentes.add(item['cod'])

    # Add new items from BCCA (with prefix to avoid conflicts)
    nuevas = 0
    duplicadas = 0

    for item in bcca:
        if 'cod' not in item or not item['cod']:
            continue

        codigo_original = item['cod']

        # Skip auxiliary/chapter entries
        if codigo_original.startswith('-') or codigo_original.startswith('#'):
            continue

        # Check if exists
        if codigo_original in codigos_existentes:
            duplicadas += 1
            continue

        # Add with BCCA prefix to identify source
        item_nuevo = item.copy()
        item_nuevo['cod'] = f"BCCA_{codigo_original}"
        item_nuevo['fuente'] = 'Andalucia'

        bcextrem.append(item_nuevo)
        codigos_existentes.add(item_nuevo['cod'])
        nuevas += 1

    print(f"\n[INFO] Resultados:")
    print(f"  - Partidas BCEXTREM originales: {len(bcextrem) - nuevas}")
    print(f"  - Partidas nuevas de BCCA: {nuevas}")
    print(f"  - Partidas duplicadas omitidas: {duplicadas}")
    print(f"  - TOTAL combinado: {len(bcextrem)} partidas")

    # Save combined database
    try:
        output_file = 'precios-combinado.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(bcextrem, f, ensure_ascii=False, separators=(',', ':'))

        print(f"\n[OK] Base combinada guardada: {output_file}")

        # Show file sizes
        import os
        size_mb = os.path.getsize(output_file) / (1024 * 1024)
        print(f"[OK] Tamano del archivo: {size_mb:.2f} MB")

    except Exception as e:
        print(f"[ERROR] Error al guardar: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
