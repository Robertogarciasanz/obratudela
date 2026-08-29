#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para reorganizar la base de datos de precios con jerarquía correcta.
Extrae capítulos del archivo BC3 y los añade a cada partida en el JSON.
"""

import json
import re
from pathlib import Path

# Rutas
BASE_DIR = Path(__file__).parent.parent
BC3_FILE = BASE_DIR / 'data' / 'BASE_PRECIOS_UNIFICADA.bc3'
JSON_INPUT = BASE_DIR / 'data' / 'base-precios.json'
JSON_OUTPUT = BASE_DIR / 'data' / 'base-precios-organizados.json'

# Estructura de capítulos jerárquica
CAPITULOS = {
    '01': {'nombre': 'Demoliciones', 'grupo': 'Demolición'},
    '02': {'nombre': 'Acondicionamiento del terreno', 'grupo': 'Demolición'},
    '03': {'nombre': 'Cimentaciones', 'grupo': 'Estructura'},
    '04': {'nombre': 'Estructuras', 'grupo': 'Estructura'},
    '05': {'nombre': 'Fachadas y particiones', 'grupo': 'Envolvente'},
    '06': {'nombre': 'Instalaciones', 'grupo': 'Instalaciones'},
    '07': {'nombre': 'Aislamientos', 'grupo': 'Envolvente'},
    '08': {'nombre': 'Revestimientos', 'grupo': 'Acabados'},
    '09': {'nombre': 'Cubiertas', 'grupo': 'Envolvente'},
    '10': {'nombre': 'Señalización', 'grupo': 'Urbanización'},
    '11': {'nombre': 'Pavimentos', 'grupo': 'Acabados'},
    '12': {'nombre': 'Carpintería', 'grupo': 'Acabados'},
    '13': {'nombre': 'Vidrios', 'grupo': 'Acabados'},
    '14': {'nombre': 'Pinturas', 'grupo': 'Acabados'},
    '15': {'nombre': 'Equipamiento', 'grupo': 'Acabados'},
    '16': {'nombre': 'Urbanización exterior', 'grupo': 'Urbanización'},
    '17': {'nombre': 'Mobiliario urbano', 'grupo': 'Urbanización'},
    '18': {'nombre': 'Jardinería', 'grupo': 'Urbanización'},
    '19': {'nombre': 'Control de calidad', 'grupo': 'Gestión'},
    '21': {'nombre': 'Gestión de residuos', 'grupo': 'Gestión'},
}

# Recursos (no son partidas de obra)
RECURSOS = {
    'A': 'Materiales',
    'C': 'Materiales',
    'D': 'Materiales',
    'E': 'Materiales',
    'F': 'Materiales',
    'G': 'Materiales',
    'H': 'Materiales',
    'I': 'Materiales',
    'K': 'Materiales',
    'M': 'Maquinaria',
    'N': 'Maquinaria',
    'P': 'Mano de Obra',
    'Q': 'Mano de Obra',
    'R': 'Mano de Obra',
    'S': 'Mano de Obra',
    'T': 'Mano de Obra',
    'U': 'Materiales',
    'V': 'Materiales',
    'W': 'Materiales',
    'X': 'Materiales',
}

def extraer_capitulos_bc3():
    """Extrae la estructura de capítulos del archivo BC3."""
    capitulos = {}

    try:
        with open(BC3_FILE, 'r', encoding='latin-1', errors='ignore') as f:
            for line in f:
                if line.startswith('~C|'):
                    # Formato: ~C|codigo|unidad|descripcion|precio|
                    parts = line.strip().split('|')
                    if len(parts) >= 4:
                        codigo = parts[1]
                        descripcion = parts[3]

                        # Solo capítulos (terminan en #)
                        if codigo.endswith('#'):
                            codigo_limpio = codigo.rstrip('#')
                            capitulos[codigo_limpio] = descripcion
    except Exception as e:
        print(f"Error leyendo BC3: {e}")

    return capitulos

def clasificar_partida(codigo):
    """Clasifica una partida según su código."""

    if not codigo:
        return {
            'capitulo': 'Sin clasificar',
            'subcapitulo': '',
            'grupo': 'Otros',
            'es_recurso': False
        }

    # Primero verificar si empieza con 2 dígitos (partidas de obra)
    match_obra = re.match(r'^(\d{2})', codigo)
    if match_obra:
        cap_num = match_obra.group(1)

        if cap_num in CAPITULOS:
            cap_info = CAPITULOS[cap_num]
            return {
                'capitulo': cap_info['nombre'],
                'subcapitulo': '',
                'grupo': cap_info['grupo'],
                'es_recurso': False
            }

    # Si no, verificar si es un recurso (1 letra + números/letras)
    primer_caracter = codigo[0]
    if primer_caracter.isalpha() and primer_caracter.upper() in RECURSOS:
        return {
            'capitulo': RECURSOS[primer_caracter.upper()],
            'subcapitulo': RECURSOS[primer_caracter.upper()],
            'grupo': 'Recursos',
            'es_recurso': True
        }

    # Por defecto
    return {
        'capitulo': 'Sin clasificar',
        'subcapitulo': '',
        'grupo': 'Otros',
        'es_recurso': False
    }

def reorganizar_base_datos():
    """Reorganiza el JSON añadiendo información de capítulos."""

    print("Cargando base de datos original...")
    with open(JSON_INPUT, 'r', encoding='utf-8') as f:
        partidas = json.load(f)

    print(f"Cargadas {len(partidas)} partidas")

    print("\nClasificando partidas por capitulos...")

    # Estadísticas
    stats = {}

    for partida in partidas:
        codigo = partida.get('cod', '')
        clasificacion = clasificar_partida(codigo)

        # Añadir campos de clasificación
        partida['capitulo'] = clasificacion['capitulo']
        partida['subcapitulo'] = clasificacion['subcapitulo']
        partida['grupo'] = clasificacion['grupo']
        partida['es_recurso'] = clasificacion['es_recurso']

        # Estadísticas
        grupo = clasificacion['grupo']
        stats[grupo] = stats.get(grupo, 0) + 1

    print("\nEstadisticas de clasificacion:")
    for grupo, count in sorted(stats.items()):
        print(f"   {grupo}: {count} partidas")

    print(f"\nGuardando en {JSON_OUTPUT.name}...")
    with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(partidas, f, ensure_ascii=False, indent=2)

    print("Base de datos reorganizada correctamente!")
    print(f"\nArchivo generado: {JSON_OUTPUT}")

    return len(partidas)

if __name__ == '__main__':
    try:
        total = reorganizar_base_datos()
        print(f"\nProceso completado: {total} partidas clasificadas")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
