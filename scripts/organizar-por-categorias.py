#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Reorganiza la base de datos añadiendo categorías inteligentes
"""

import json
import re

# Mapeo de categorías basado en códigos y palabras clave
CATEGORIAS = {
    'DEMOLICION': {
        'codigos': ['01', 'E01', 'D0', 'U01C'],
        'palabras': ['DEMOLICION', 'DEMOLIC', 'LEVANTADO', 'DESMONTAJE', 'DERRIBO', 'ARRANQUE']
    },
    'ESTRUCTURAS': {
        'codigos': ['03', '04', 'E03', 'E04', 'H0'],
        'palabras': ['HORMIGON', 'CIMENT', 'ZAPATA', 'MURO', 'PILAR', 'VIGA', 'FORJADO', 'ENCOFRADO', 'ARMADURA', 'ACERO']
    },
    'EXCAVACION': {
        'codigos': ['02', 'E02', 'U02'],
        'palabras': ['EXCAVACION', 'ZANJA', 'VACIADO', 'TIERRA', 'RELLENO', 'COMPACTADO', 'TERRAPLEN']
    },
    'URBANIZACION': {
        'codigos': ['U0', 'U1'],
        'palabras': ['PAVIMENTO', 'BORDILLO', 'ACERA', 'CALZADA', 'ADOQUIN', 'ASFALTO', 'ALCANTARILLA', 'ARQUETA']
    },
    'JARDINERIA': {
        'codigos': ['F0'],
        'palabras': ['JARDIN', 'CESPED', 'ARBOL', 'PLANTA', 'VEGETAL', 'RIEGO', 'PODA']
    },
    'REVESTIMIENTOS': {
        'codigos': ['R0', 'E07', '07'],
        'palabras': ['ENFOSCADO', 'ENLUCIDO', 'ALICATADO', 'SOLADO', 'PAVIMENTO', 'AZULEJO', 'BALDOSA', 'GRES']
    },
    'AISLAMIENTO': {
        'codigos': ['N0'],
        'palabras': ['AISLAMIENTO', 'AISLA', 'TERMIC', 'ACUSTIC', 'LANA', 'POLIURETANO', 'POLIESTIRENO']
    },
    'INSTALACIONES': {
        'codigos': ['06', 'E06', 'I0'],
        'palabras': ['INSTALACION', 'FONTANERIA', 'ELECTRICIDAD', 'CALEFACCION', 'CLIMATIZACION', 'SANITARIO', 'LAVABO', 'INODORO']
    },
    'CUBIERTAS': {
        'codigos': ['05', 'E05', 'Q0'],
        'palabras': ['CUBIERTA', 'TEJA', 'LUCERNARIO', 'IMPERMEABILIZACION', 'CANALON']
    },
    'CARPINTERIA': {
        'codigos': ['L0'],
        'palabras': ['PUERTA', 'VENTANA', 'CARPINTERIA', 'CERRAMIENTO', 'CRISTAL', 'VIDRIO']
    },
    'CARGA_TRANSPORTE': {
        'codigos': ['G01C'],
        'palabras': ['CARGA', 'TRANSPORTE', 'ESCOMBROS', 'RESIDUOS', 'CAMION']
    },
    'ALQUILERES': {
        'codigos': ['M0'],
        'palabras': ['ALQUILER', 'MAQUINA', 'RETROEXCAVADORA', 'CAMION', 'DUMPER', 'COMPRESOR']
    },
    'MANO_OBRA': {
        'codigos': ['MO', 'TP'],
        'palabras': ['OFICIAL', 'PEON', 'AYUDANTE', 'ENCARGADO', 'CUADRILLA']
    },
    'MATERIALES': {
        'codigos': ['A0', 'P0', 'MK', 'MT'],
        'palabras': ['CEMENTO', 'ARENA', 'GRAVA', 'LADRILLO', 'BLOQUE', 'YESO', 'MORTERO']
    },
    'CONTROL_CALIDAD': {
        'codigos': ['C0'],
        'palabras': ['ENSAYO', 'CONTROL', 'CALIDAD', 'ANALISIS', 'PRUEBA']
    },
    'MONTAJE': {
        'palabras': ['MONTAJE', 'INSTALACION', 'COLOCACION']
    }
}

def clasificar_partida(cod, res):
    """Clasifica una partida en una categoría"""
    cod_upper = cod.upper()
    res_upper = res.upper()

    # Buscar por código
    for categoria, config in CATEGORIAS.items():
        if 'codigos' in config:
            for prefix in config['codigos']:
                if cod_upper.startswith(prefix):
                    return categoria

    # Buscar por palabras clave
    for categoria, config in CATEGORIAS.items():
        for palabra in config['palabras']:
            if palabra in res_upper:
                return categoria

    return 'OTROS'

# Cargar base de datos actual
print("Cargando base de datos...")
with open('../data/base-precios.json', 'r', encoding='utf-8') as f:
    partidas = json.load(f)

print(f"Total partidas: {len(partidas)}")

# Clasificar partidas
datos_por_categoria = {}
for partida in partidas:
    categoria = clasificar_partida(partida['cod'], partida['res'])

    if categoria not in datos_por_categoria:
        datos_por_categoria[categoria] = []

    datos_por_categoria[categoria].append(partida)

# Mostrar estadísticas
print("\nPartidas por categoría:")
total = 0
for categoria, items in sorted(datos_por_categoria.items(), key=lambda x: -len(x[1])):
    count = len(items)
    total += count
    print(f"  {categoria}: {count}")

print(f"\nTotal clasificado: {total}")

# Guardar JSON categorizado
output = {
    'categorias': datos_por_categoria,
    'metadata': {
        'total_partidas': len(partidas),
        'total_categorias': len(datos_por_categoria),
        'version': '2026.2'
    }
}

with open('../data/base-precios-categorizado.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\nGuardado en: ../data/base-precios-categorizado.json")

# También guardar versión plana con campo 'categoria' añadido
partidas_con_categoria = []
for categoria, items in datos_por_categoria.items():
    for item in items:
        item_copia = item.copy()
        item_copia['categoria'] = categoria
        partidas_con_categoria.append(item_copia)

with open('../data/base-precios.json', 'w', encoding='utf-8') as f:
    json.dump(partidas_con_categoria, f, ensure_ascii=False, separators=(',', ':'))

print(f"Actualizado: ../data/base-precios.json (con campo categoria)")
