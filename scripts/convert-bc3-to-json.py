#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Conversor BC3 (FIEBDC-3) a JSON
Convierte archivos BC3 de bases de precios de construcción a formato JSON
"""

import sys
import json
import re

def parse_bc3(filepath):
    """Parse BC3 file and convert to JSON structure"""
    precios = []

    try:
        # Try different encodings
        encodings = ['latin-1', 'cp1252', 'utf-8', 'iso-8859-1']
        content = None

        for encoding in encodings:
            try:
                with open(filepath, 'r', encoding=encoding) as f:
                    content = f.read()
                print(f"[OK] Archivo leido correctamente con encoding: {encoding}")
                break
            except UnicodeDecodeError:
                continue

        if content is None:
            print("[ERROR] No se pudo leer el archivo con ningun encoding")
            return []

        # Split by lines
        lines = content.split('\n')

        current_item = None

        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            if not line or line.startswith('~V'):
                continue

            # Parse record type
            if line.startswith('~C'):
                # Concepto (item/partida)
                parts = line.split('|')
                if len(parts) >= 5:
                    codigo = parts[1].strip() if len(parts) > 1 else ''
                    unidad = parts[2].strip() if len(parts) > 2 else ''
                    resumen = parts[3].strip() if len(parts) > 3 else ''
                    precio = parts[4].strip() if len(parts) > 4 else '0'

                    # Clean and convert price
                    try:
                        precio_float = float(precio.replace(',', '.'))
                    except:
                        precio_float = 0.0

                    current_item = {
                        'cod': codigo,
                        'uni': unidad,
                        'res': resumen,
                        'pre': precio_float,
                        'desc': '',
                        'tipo': 0  # 0=partida, 1=capitulo, 2=subcapitulo
                    }

            elif line.startswith('~T'):
                # Tipo de concepto
                if current_item:
                    parts = line.split('|')
                    if len(parts) >= 3:
                        tipo_str = parts[2].strip() if len(parts) > 2 else '0'
                        current_item['tipo'] = int(tipo_str) if tipo_str.isdigit() else 0

            elif line.startswith('~D'):
                # Descripción
                if current_item:
                    parts = line.split('|')
                    desc_parts = []
                    for i in range(1, len(parts)):
                        if parts[i].strip():
                            desc_parts.append(parts[i].strip())
                    current_item['desc'] = ' '.join(desc_parts)

                    # Add to list
                    if current_item['cod']:
                        precios.append(current_item)
                    current_item = None

        print(f"[OK] Procesadas {len(precios)} partidas del archivo BC3")
        return precios

    except Exception as e:
        print(f"[ERROR] Error al procesar BC3: {str(e)}")
        return []

def main():
    if len(sys.argv) < 2:
        print("Uso: python convert-bc3-to-json.py <archivo.bc3> [salida.json]")
        print("Ejemplo: python convert-bc3-to-json.py BCCA2023_V02.bc3 bcca.json")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file.replace('.bc3', '.json')

    print(f"\n[INFO] Convirtiendo {input_file} a JSON...")
    print(f"[INFO] Archivo de salida: {output_file}\n")

    precios = parse_bc3(input_file)

    if not precios:
        print("[ERROR] No se encontraron datos para convertir")
        sys.exit(1)

    # Save to JSON
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(precios, f, ensure_ascii=False, indent=2)

        print(f"\n[OK] Conversion completada exitosamente")
        print(f"[OK] Total de partidas: {len(precios)}")
        print(f"[OK] Archivo guardado: {output_file}")

        # Show sample
        if precios:
            print(f"\n[MUESTRA] Ejemplo de partida:")
            print(f"   Codigo: {precios[0]['cod']}")
            print(f"   Resumen: {precios[0]['res']}")
            print(f"   Precio: {precios[0]['pre']} EUR/{precios[0]['uni']}")

    except Exception as e:
        print(f"[ERROR] Error al guardar JSON: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
