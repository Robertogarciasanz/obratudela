#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extrae la base de datos del archivo presupuesto_bueno.html y la convierte a JSON
"""

import re
import json
import base64
import gzip

# Leer el archivo HTML
with open('F:/presupuestos/presupuesto_bueno.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Buscar la variable DATA_B64
match = re.search(r'const DATA_B64 = "(.*?)";', html, re.DOTALL)
if not match:
    print("ERROR: No se encontró DATA_B64")
    exit(1)

data_b64 = match.group(1)
print(f"DATA_B64 encontrado: {len(data_b64)} caracteres")

# Decodificar Base64
binary = base64.b64decode(data_b64)
print(f"Decodificado: {len(binary)} bytes")

# Descomprimir GZIP
decompressed = gzip.decompress(binary).decode('utf-8')
print(f"Descomprimido: {len(decompressed)} caracteres")

# Parsear JSON
raw_data = json.loads(decompressed)
print(f"JSON parseado: {len(raw_data)} hojas")

# Convertir al formato de ObraTudela: array plano con {cod, uni, res, precio}
all_items = []
for sheet_name, rows in raw_data.items():
    for row in rows:
        all_items.append({
            'cod': row[0],
            'uni': row[1],
            'res': row[2],
            'precio': float(row[3]) if row[3] else 0.0
        })
    print(f"  {sheet_name}: {len(rows)} partidas")

print(f"\nTotal de partidas: {len(all_items)}")

# Guardar como JSON
output_path = '../data/base-precios-from-html.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(all_items, f, ensure_ascii=False, indent=2)

print(f"\nGuardado en: {output_path}")
print(f"Tamaño: {len(json.dumps(all_items, ensure_ascii=False))/1024/1024:.1f} MB")
