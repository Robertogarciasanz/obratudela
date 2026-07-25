#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Conversor de BC3 (FIEBDC-3) a JSON con desgloses completos
Basado en la especificación FIEBDC-3
"""

import sys
import json
import codecs
from collections import defaultdict

def parse_bc3(filepath):
    """
    Parsea un archivo BC3 y extrae partidas con desgloses
    """
    print(f"[INFO] Leyendo archivo BC3: {filepath}")

    # El formato BC3 puede estar en Latin-1 o CP850
    encodings = ['latin-1', 'cp850', 'utf-8']
    content = None

    for encoding in encodings:
        try:
            with codecs.open(filepath, 'r', encoding=encoding) as f:
                content = f.read()
            print(f"[OK] Archivo leído con codificación: {encoding}")
            break
        except UnicodeDecodeError:
            continue

    if not content:
        raise Exception("No se pudo leer el archivo con ninguna codificación conocida")

    # El archivo BC3 está organizado por registros que empiezan con ~
    lines = content.split('~')

    partidas = {}
    conceptos = {}
    descomposiciones = defaultdict(list)

    total_lines = len(lines)
    processed = 0

    print(f"[STAT] Total de registros a procesar: {total_lines}")

    for line in lines:
        processed += 1
        if processed % 1000 == 0:
            print(f"   Procesando... {processed}/{total_lines} ({processed*100//total_lines}%)")

        if not line.strip():
            continue

        # Los campos están separados por |
        campos = line.split('|')

        if len(campos) < 2:
            continue

        tipo_registro = campos[0]

        # Registro C: Conceptos/Partidas
        if tipo_registro == 'C':
            try:
                codigo = campos[1] if len(campos) > 1 else ''
                unidad = campos[2] if len(campos) > 2 else ''
                resumen = campos[3] if len(campos) > 3 else ''
                precio = campos[4] if len(campos) > 4 else '0'

                # Limpiar precio
                try:
                    precio_num = float(precio.replace(',', '.'))
                except:
                    precio_num = 0.0

                conceptos[codigo] = {
                    'cod': codigo,
                    'uni': unidad,
                    'res': resumen[:100],  # Limitar longitud
                    'precio': precio_num,
                    'tipo': 'partida'
                }
            except Exception as e:
                pass

        # Registro D: Descomposiciones
        elif tipo_registro == 'D':
            try:
                codigo_padre = campos[1] if len(campos) > 1 else ''
                componentes_str = campos[2] if len(campos) > 2 else ''

                if componentes_str and codigo_padre:
                    # Los componentes vienen como: codigo\tipo\cantidad\codigo\tipo\cantidad\
                    partes = componentes_str.split('\\')

                    # Procesar en grupos de 3: codigo, tipo, cantidad
                    i = 0
                    while i < len(partes) - 2:
                        codigo_hijo = partes[i].strip()
                        tipo = partes[i + 1].strip()  # 1=MO, 2=MAT, 3=MAQ (aparentemente)
                        cantidad_str = partes[i + 2].strip()

                        if codigo_hijo and cantidad_str:
                            try:
                                cantidad_num = float(cantidad_str.replace(',', '.'))
                            except:
                                cantidad_num = 0.0

                            descomposiciones[codigo_padre].append({
                                'cod': codigo_hijo,
                                'tipo': tipo,
                                'cantidad': cantidad_num
                            })

                        i += 3
            except Exception as e:
                pass

        # Registro T: Textos descriptivos
        elif tipo_registro == 'T':
            try:
                codigo = campos[1] if len(campos) > 1 else ''
                descripcion = campos[2] if len(campos) > 2 else ''

                if codigo in conceptos:
                    conceptos[codigo]['desc'] = descripcion
            except:
                pass

    print(f"\n[OK] Procesamiento completo")
    print(f"   Conceptos encontrados: {len(conceptos)}")
    print(f"   Descomposiciones: {len(descomposiciones)}")

    # Clasificar partidas por tipo
    mano_obra = {}
    materiales = {}
    maquinaria = {}
    partidas_compuestas = {}

    for codigo, concepto in conceptos.items():
        # Determinar tipo según el código
        if codigo.startswith('O'):
            concepto['categoria'] = 'MANO DE OBRA'
            mano_obra[codigo] = concepto
        elif codigo.startswith('P'):
            concepto['categoria'] = 'MATERIALES'
            materiales[codigo] = concepto
        elif codigo.startswith('M'):
            concepto['categoria'] = 'MAQUINARIA'
            maquinaria[codigo] = concepto
        else:
            # Determinar categoría según primera letra
            primera = codigo[0] if codigo else 'X'
            if primera in 'ABCDEFGHIJKLNQRSTUVWXYZ':
                concepto['categoria'] = primera + '0'
            else:
                concepto['categoria'] = 'OTROS'

            # Añadir descomposición si existe
            if codigo in descomposiciones:
                concepto['descomposicion'] = descomposiciones[codigo]

            partidas_compuestas[codigo] = concepto

    print(f"\n[PKG] Clasificacion:")
    print(f"   Mano de obra: {len(mano_obra)}")
    print(f"   Materiales: {len(materiales)}")
    print(f"   Maquinaria: {len(maquinaria)}")
    print(f"   Partidas compuestas: {len(partidas_compuestas)}")

    return {
        'conceptos': conceptos,
        'mano_obra': mano_obra,
        'materiales': materiales,
        'maquinaria': maquinaria,
        'partidas': partidas_compuestas,
        'descomposiciones': descomposiciones
    }

def main():
    if len(sys.argv) < 2:
        print("Uso: python convert-bc3-to-json.py <archivo.bc3>")
        sys.exit(1)

    bc3_file = sys.argv[1]
    output_file = bc3_file.replace('.bc3', '_parsed.json')

    try:
        datos = parse_bc3(bc3_file)

        # Guardar todos los conceptos en un solo JSON
        output_data = {
            '@context': 'https://schema.org/',
            '@type': 'Dataset',
            'name': 'Base de Precios BCEXTREM 2026 (BC3 Parseado)',
            'description': 'Conversión de BC3 a JSON con descomposiciones completas',
            'totalItems': len(datos['conceptos']),
            'items': list(datos['partidas'].values()),
            'recursos': {
                'mano_obra': list(datos['mano_obra'].values()),
                'materiales': list(datos['materiales'].values()),
                'maquinaria': list(datos['maquinaria'].values())
            },
            'metadata': {
                'total_conceptos': len(datos['conceptos']),
                'total_mano_obra': len(datos['mano_obra']),
                'total_materiales': len(datos['materiales']),
                'total_maquinaria': len(datos['maquinaria']),
                'total_partidas': len(datos['partidas']),
                'total_descomposiciones': len(datos['descomposiciones'])
            }
        }

        print(f"\n[SAVE] Guardando en: {output_file}")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)

        print(f"[DONE] Conversión completada exitosamente")
        print(f"   Archivo generado: {output_file}")
        print(f"   Tamaño: {len(json.dumps(output_data)) / 1024 / 1024:.2f} MB")

        # Mostrar algunos ejemplos
        print(f"\n[SEARCH] Ejemplos de partidas con descomposición:")
        count = 0
        for codigo, partida in datos['partidas'].items():
            if 'descomposicion' in partida and count < 3:
                print(f"\n   {codigo} - {partida['res']}")
                print(f"   Precio: {partida['precio']}€")
                print(f"   Descomposición ({len(partida['descomposicion'])} elementos):")
                for comp in partida['descomposicion'][:3]:
                    print(f"      - {comp['cod']} x {comp['cantidad']}")
                count += 1

    except Exception as e:
        print(f"[ERROR] Error al procesar el archivo: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
