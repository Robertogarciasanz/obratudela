#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Organiza la base de datos BC3 nativa con capítulos y grupos
"""

import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
JSON_INPUT = BASE_DIR / 'data' / 'base-precios-bc3-nativo.json'
JSON_OUTPUT = BASE_DIR / 'data' / 'base-precios-final.json'

# Estructura de capítulos
CAPITULOS = {
    '01': {'nombre': 'Demoliciones y trabajos previos', 'grupo': 'Demolición'},
    '02': {'nombre': 'Acondicionamiento del terreno', 'grupo': 'Demolición'},
    '03': {'nombre': 'Cimentaciones', 'grupo': 'Estructura'},
    '04': {'nombre': 'Estructuras', 'grupo': 'Estructura'},
    '05': {'nombre': 'Fachadas y particiones', 'grupo': 'Envolvente'},
    '06': {'nombre': 'Instalaciones', 'grupo': 'Instalaciones'},
    '07': {'nombre': 'Aislamientos e impermeabilizaciones', 'grupo': 'Envolvente'},
    '08': {'nombre': 'Revestimientos y trasdosados', 'grupo': 'Acabados'},
    '09': {'nombre': 'Cubiertas', 'grupo': 'Envolvente'},
    '10': {'nombre': 'Señalización y equipamiento vial', 'grupo': 'Urbanización'},
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

def clasificar_partida_bc3(cod, res):
    """Clasifica partida BC3 según su código."""

    # Ignorar capítulos (terminan en #)
    if cod.endswith('#'):
        return None

    # Extraer código de capítulo (primeros 2 dígitos)
    match = re.match(r'^(\d{2})', cod)
    if match:
        cap_num = match.group(1)
        if cap_num in CAPITULOS:
            cap_info = CAPITULOS[cap_num]
            return {
                'capitulo': cap_info['nombre'],
                'grupo': cap_info['grupo'],
                'es_capitulo': False
            }

    return {
        'capitulo': 'Sin clasificar',
        'grupo': 'Otros',
        'es_capitulo': False
    }

def organizar():
    """Organiza partidas BC3 con capítulos."""

    print("Cargando base de datos BC3 nativa...")
    with open(JSON_INPUT, 'r', encoding='utf-8') as f:
        partidas_bc3 = json.load(f)

    print(f"Cargadas {len(partidas_bc3)} entradas del BC3")

    partidas_finales = []
    stats = {}

    print("\nOrganizando partidas...")

    for item in partidas_bc3:
        cod = item.get('cod', '')
        res = item.get('res', '')

        clasificacion = clasificar_partida_bc3(cod, res)

        # Ignorar capítulos y entradas auxiliares
        if clasificacion is None or cod.startswith('-'):
            continue

        # Crear partida organizada
        partida = {
            'cod': cod,
            'res': res,
            'desc': item.get('desc', ''),
            'uni': item.get('uni', ''),
            'precio': item.get('pre', 0),  # 'pre' en BC3, 'precio' en JSON
            'capitulo': clasificacion['capitulo'],
            'grupo': clasificacion['grupo']
        }

        partidas_finales.append(partida)

        # Estadísticas
        grupo = clasificacion['grupo']
        stats[grupo] = stats.get(grupo, 0) + 1

    print("\nEstadisticas:")
    for grupo, count in sorted(stats.items()):
        print(f"   {grupo}: {count} partidas")

    print(f"\nGuardando {len(partidas_finales)} partidas en {JSON_OUTPUT.name}...")
    with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(partidas_finales, f, ensure_ascii=False, indent=2)

    print("Base de datos final generada!")

    # Mostrar ejemplos
    print("\nEjemplos de partidas organizadas:")
    print("-" * 80)
    for p in partidas_finales[:10]:
        print(f"{p['cod']:15} | {p['grupo']:15} | {p['res'][:45]}")

    return len(partidas_finales)

if __name__ == '__main__':
    try:
        total = organizar()
        print(f"\nProceso completado: {total} partidas en base de datos final")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
