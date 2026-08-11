#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Conversor de BC3 (FIEBDC-3) a JSON con desgloses completos
Basado en la especificación FIEBDC-3
"""

import sys
import json
import os
import codecs
from collections import defaultdict
import logging

# Configurar logging básico
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')



def parse_bc3(filepath):
    """
    Parsea un archivo BC3 y extrae partidas con desgloses
    """
    print(f"[INFO] Leyendo archivo BC3: {filepath}")

    # El formato BC3 puede estar en Latin-1, CP850 o UTF-8
    encodings = ['latin-1', 'cp850', 'utf-8']
    content = None

    for encoding in encodings:
        try:
            with codecs.open(filepath, 'r', encoding=encoding) as f:
                content = f.read()
            logging.info(f"Archivo leído con codificación: {encoding}")
            break
        except UnicodeDecodeError:
            continue

    if not content:
        raise IOError(f"No se pudo decodificar el archivo con las codificaciones probadas: {encodings}")

    # El archivo BC3 está organizado por registros que empiezan con ~
    lines = content.split('~')

    partidas = {}
    conceptos = {}
    descomposiciones = defaultdict(list)

    total_lines = len(lines)
    processed = 0

    logging.info(f"Total de registros a procesar: {total_lines}")

    for line in lines:
        processed += 1
        if processed % 1000 == 0:
            print(f"   Procesando... {processed}/{total_lines} ({processed*100//total_lines}%)")

        if not line.strip():
            continue

        # Los campos están separados por |
        campos = [campo.strip() for campo in line.split('|')]

        if len(campos) < 2:
            continue

        tipo_registro = campos[0]

        try:
            # Registro C: Conceptos/Partidas
            if tipo_registro == 'C' and len(campos) > 4:
                codigo, unidad, resumen, precio_str = campos[1:5]

                # Limpiar precio
                try:
                    precio_num = float(precio_str.replace(',', '.'))
                except ValueError:
                    precio_num = 0.0

                conceptos[codigo] = {
                    'cod': codigo,
                    'uni': unidad,
                    'res': resumen[:100],  # Limitar longitud
                    'precio': precio_num,
                    'tipo': 'partida'
                }

            # Registro D: Descomposiciones
            elif tipo_registro == 'D' and len(campos) > 2:
                codigo_padre = campos[1]
                componentes_str = campos[2]

                if componentes_str and codigo_padre:
                    # Los componentes vienen como: codigo\tipo\cantidad\codigo\tipo\cantidad\
                    partes = componentes_str.split('\\')

                    # Procesar en grupos de 3: codigo, tipo, cantidad
                    # Usamos un iterador para agrupar de 3 en 3
                    it = iter(partes)
                    for codigo_hijo, tipo, cantidad_str in zip(it, it, it):
                        codigo_hijo = codigo_hijo.strip()
                        tipo = tipo.strip()
                        cantidad_str = cantidad_str.strip()

                        if codigo_hijo and cantidad_str:
                            try:
                                cantidad_num = float(cantidad_str.replace(',', '.'))
                            except ValueError:
                                cantidad_num = 0.0

                            descomposiciones[codigo_padre].append({
                                'cod': codigo_hijo,
                                'tipo': tipo,
                                'cantidad': cantidad_num
                            })

            # Registro T: Textos descriptivos
            elif tipo_registro == 'T' and len(campos) > 2:
                codigo = campos[1]
                descripcion = campos[2]

                if codigo in conceptos and descripcion:
                    # Concatenar descripciones si ya existe una
                    conceptos[codigo]['desc'] = conceptos[codigo].get('desc', '') + descripcion

        except IndexError as e:
            logging.warning(f"Registro mal formado, ignorando: {line[:50]}... - Error: {e}")
        except Exception as e:
            logging.error(f"Error inesperado procesando registro: {line[:50]}... - Error: {e}")

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

    # Mapeo de capítulos para la división de archivos
    capitulos_map = {
        '01': ['DEMOLICION', 'R0'], '02': ['CARGA'], '03': ['E1', 'A0'],
        '04': ['N0'], '05': ['AISLAMIENTO'], '11': ['SEGURIDAD', 'C0'], '12': ['JARDINERIA', 'U0']
    }

    categorias_partidas = {codigo: concepto.get('categoria', 'OTROS') for codigo, concepto in partidas_compuestas.items()}

    return {
        'conceptos': conceptos,
        'mano_obra': mano_obra,
        'materiales': materiales,
        'maquinaria': maquinaria,
        'partidas': partidas_compuestas,
        'descomposiciones': descomposiciones,
        'capitulos_map': capitulos_map,
        'categorias_partidas': categorias_partidas
    }

def main():
    if len(sys.argv) < 2:
        print("Uso: python convert-bc3-to-json.py <archivo.bc3>")
        sys.exit(1)

    bc3_file = sys.argv[1]
    output_dir = 'precios_db'

    try:
        datos = parse_bc3(bc3_file)

        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            logging.info(f"Directorio creado: {output_dir}")

        # 1. Guardar recursos (mano de obra, materiales, maquinaria)
        recursos = {
            'mano_obra': datos['mano_obra'],
            'materiales': datos['materiales'],
            'maquinaria': datos['maquinaria']
        }
        recursos_file = os.path.join(output_dir, 'recursos.json')
        with open(recursos_file, 'w', encoding='utf-8') as f:
            json.dump(recursos, f, ensure_ascii=False)
        logging.info(f"Recursos guardados en: {recursos_file}")

        # 2. Agrupar partidas por capítulo
        partidas_por_capitulo = defaultdict(list)
        categorias_a_capitulo = {cat: cap for cap, cats in datos['capitulos_map'].items() for cat in cats}

        for codigo, partida in datos['partidas'].items():
            categoria_partida = datos['categorias_partidas'].get(codigo, 'OTROS')
            # Extraer la clave principal de la categoría, ej. 'DEMOLICION' de 'DEMOLICION_01'
            categoria_base = categoria_partida.split('_')[0]
            num_capitulo = categorias_a_capitulo.get(categoria_base, 'OTROS')
            partidas_por_capitulo[num_capitulo].append(partida)

        # 3. Guardar cada capítulo en su propio archivo
        manifest = {
            'recursos': 'recursos.json',
            'capitulos': []
        }
        for num_capitulo, partidas_cap in partidas_por_capitulo.items():
            filename = f"capitulo_{num_capitulo}.json"
            filepath = os.path.join(output_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(partidas_cap, f, ensure_ascii=False)
            
            manifest['capitulos'].append({
                'num': num_capitulo,
                'file': filename,
                'count': len(partidas_cap)
            })
            logging.info(f"Capítulo {num_capitulo} guardado en {filepath} ({len(partidas_cap)} partidas)")

        # 4. Guardar el archivo manifest (índice)
        manifest_file = os.path.join(output_dir, 'manifest.json')
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        logging.info(f"Archivo de manifiesto guardado en: {manifest_file}")

        print(f"\n[DONE] Conversión completada. Archivos generados en el directorio '{output_dir}'.")

        # Mostrar algunos ejemplos
        print(f"\n[SEARCH] Ejemplos de partidas con descomposición:")
        count = 0
        # Buscar en el primer capítulo que tenga partidas
        primer_cap_con_partidas = next((cap for cap in partidas_por_capitulo.values() if cap), None)
        if primer_cap_con_partidas:
            for partida in primer_cap_con_partidas:
                codigo = partida['cod']
                if 'descomposicion' not in partida or count >= 3:
                    continue

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
