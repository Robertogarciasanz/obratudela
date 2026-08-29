#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para unificar códigos de la base de datos.
Crea un sistema coherente manteniendo trazabilidad del código original.
"""

import json
import re
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).parent.parent
JSON_INPUT = BASE_DIR / 'data' / 'base-precios-organizados.json'
JSON_OUTPUT = BASE_DIR / 'data' / 'base-precios-unificada.json'

# Mapeo de grupos a prefijos
PREFIJOS_GRUPO = {
    'Demolición': 'DEM',
    'Estructura': 'EST',
    'Envolvente': 'ENV',
    'Instalaciones': 'INS',
    'Acabados': 'ACA',
    'Urbanización': 'URB',
    'Gestión': 'GES',
    'Otros': 'OTR'
}

# Mapeo de capítulos a números
CAPITULOS_NUM = {
    'Demoliciones': '001',
    'Acondicionamiento del terreno': '002',
    'Cimentaciones': '003',
    'Estructuras': '004',
    'Fachadas y particiones': '005',
    'Instalaciones': '006',
    'Aislamientos': '007',
    'Revestimientos': '008',
    'Cubiertas': '009',
    'Señalización': '010',
    'Pavimentos': '011',
    'Carpintería': '012',
    'Vidrios': '013',
    'Pinturas': '014',
    'Equipamiento': '015',
    'Urbanización exterior': '016',
    'Mobiliario urbano': '017',
    'Jardinería': '018',
    'Control de calidad': '019',
    'Gestión de residuos': '021',
}

def es_codigo_bc3_valido(cod):
    """Verifica si un código es del formato BC3 estándar."""
    # Formato BC3: 2 dígitos + letras/números
    # Ej: 01AAB00001, 02ACC00001, E02AA010
    return bool(re.match(r'^(\d{2}[A-Z]{2,}|\d{2}[A-Z]\d{5}|E\d{2}[A-Z]{2})', cod))

def unificar_codigos():
    """Unifica códigos manteniendo BC3 cuando sea posible."""

    print("Cargando base de datos organizada...")
    with open(JSON_INPUT, 'r', encoding='utf-8') as f:
        partidas = json.load(f)

    print(f"Cargadas {len(partidas)} partidas")

    # Contadores por grupo
    contadores = defaultdict(lambda: defaultdict(int))

    # Estadísticas
    stats = {
        'bc3_mantenidos': 0,
        'unificados': 0,
        'recursos_mat': 0,
        'recursos_mo': 0,
        'recursos_maq': 0,
    }

    print("\nProcesando codigos (priorizando BC3)...")

    nuevas_partidas = []
    codigos_usados = set()

    for partida in partidas:
        cod_original = partida.get('cod', '')
        grupo = partida.get('grupo', 'Otros')
        capitulo = partida.get('capitulo', '')
        es_recurso = partida.get('es_recurso', False)

        # PRIORIDAD: Mantener códigos BC3 válidos
        if es_codigo_bc3_valido(cod_original):
            nuevo_cod = cod_original
            stats['bc3_mantenidos'] += 1

        # Unificar recursos y códigos incoherentes
        elif es_recurso:
            # Recursos
            if capitulo == 'Materiales':
                prefijo = 'MAT'
                stats['recursos_mat'] += 1
            elif capitulo == 'Mano de Obra':
                prefijo = 'MO'
                stats['recursos_mo'] += 1
            elif capitulo == 'Maquinaria':
                prefijo = 'MAQ'
                stats['recursos_maq'] += 1
            else:
                prefijo = 'REC'

            contador = contadores[prefijo]['general']
            contadores[prefijo]['general'] += 1
            nuevo_cod = f"{prefijo}-{contador:06d}"

        else:
            # Partidas de obra
            prefijo = PREFIJOS_GRUPO.get(grupo, 'OTR')
            cap_num = CAPITULOS_NUM.get(capitulo, '999')

            contador = contadores[prefijo][cap_num]
            contadores[prefijo][cap_num] += 1

            nuevo_cod = f"{prefijo}-{cap_num}-{contador:04d}"
            stats['unificados'] += 1

        # Evitar duplicados (solo para códigos nuevos, no BC3)
        if not es_codigo_bc3_valido(cod_original):
            while nuevo_cod in codigos_usados:
            contador += 1
            if es_recurso:
                nuevo_cod = f"{prefijo}-{contador:06d}"
            else:
                nuevo_cod = f"{prefijo}-{cap_num}-{contador:04d}"

        codigos_usados.add(nuevo_cod)

        # Crear nueva partida
        nueva_partida = {
            'cod': nuevo_cod,
            'cod_original': cod_original,
            'res': partida.get('res', ''),
            'desc': partida.get('desc', ''),
            'uni': partida.get('uni', ''),
            'precio': partida.get('precio', 0),
            'capitulo': capitulo,
            'subcapitulo': partida.get('subcapitulo', ''),
            'grupo': grupo,
            'es_recurso': es_recurso
        }

        nuevas_partidas.append(nueva_partida)

    print("\nEstadisticas:")
    print(f"  Partidas de obra unificadas: {stats['unificadas']}")
    print(f"  Materiales: {stats['recursos_mat']}")
    print(f"  Mano de obra: {stats['recursos_mo']}")
    print(f"  Maquinaria: {stats['recursos_maq']}")

    print(f"\nGuardando en {JSON_OUTPUT.name}...")
    with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(nuevas_partidas, f, ensure_ascii=False, indent=2)

    print("Base de datos unificada correctamente!")
    print(f"\nTotal partidas: {len(nuevas_partidas)}")

    # Mostrar ejemplos
    print("\nEjemplos de codigos unificados:")
    print("-" * 60)
    for i, p in enumerate(nuevas_partidas[:10]):
        print(f"{p['cod']:20} | {p['cod_original']:15} | {p['res'][:40]}")

    return len(nuevas_partidas)

if __name__ == '__main__':
    try:
        total = unificar_codigos()
        print(f"\nProceso completado: {total} partidas unificadas")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
