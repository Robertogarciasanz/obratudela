#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador de Índice Invertido para Búsqueda Semántica
Crea un índice optimizado para búsquedas más inteligentes
"""

import json
import re
from collections import defaultdict
from pathlib import Path

# Diccionario de sinónimos y categorías relacionadas
CATEGORIAS_SEMANTICAS = {
    'demolicion': {
        'terminos': ['demoler', 'derribo', 'derribar', 'desmontaje', 'desmontar',
                     'retirada', 'retirar', 'levantado', 'arranque', 'arrancar'],
        'categoria': 'DEMOLICIONES'
    },
    'excavacion': {
        'terminos': ['excavar', 'zanja', 'vaciado', 'desmonte', 'terraplenado',
                     'movimiento tierras', 'rebaje'],
        'categoria': 'MOVIMIENTO_TIERRAS'
    },
    'hormigon': {
        'terminos': ['concreto', 'hm', 'ha', 'armado', 'masa', 'vertido'],
        'categoria': 'HORMIGONES'
    },
    'tuberia': {
        'terminos': ['tubo', 'conduccion', 'colector', 'canalizacion', 'tubular'],
        'categoria': 'INSTALACIONES'
    },
    'fontaneria': {
        'terminos': ['agua', 'sanitario', 'abastecimiento', 'acs', 'af'],
        'categoria': 'INSTALACIONES'
    },
    'electricidad': {
        'terminos': ['electrico', 'cable', 'cableado', 'instalacion electrica',
                     'cuadro electrico', 'luminaria', 'interruptor'],
        'categoria': 'INSTALACIONES'
    },
    'saneamiento': {
        'terminos': ['desague', 'evacuacion', 'residual', 'pluvial', 'alcantarillado'],
        'categoria': 'SANEAMIENTO'
    },
    'cimentacion': {
        'terminos': ['zapata', 'losa', 'viga', 'muro contencion', 'pilote'],
        'categoria': 'CIMENTACIONES'
    },
    'tabique': {
        'terminos': ['particion', 'tabicado', 'division', 'separacion'],
        'categoria': 'ALBANILERIA'
    },
    'pintura': {
        'terminos': ['pintado', 'revestimiento', 'acabado', 'temple', 'esmalte'],
        'categoria': 'REVESTIMIENTOS'
    },
    'solado': {
        'terminos': ['pavimento', 'suelo', 'baldosa', 'ceramica', 'gres'],
        'categoria': 'REVESTIMIENTOS'
    },
    'puerta': {
        'terminos': ['carpinteria', 'hoja', 'marco', 'premarco', 'acceso'],
        'categoria': 'CARPINTERIA'
    },
    'ventana': {
        'terminos': ['ventanal', 'acristalamiento', 'vidrio', 'carpinteria'],
        'categoria': 'CARPINTERIA'
    }
}

# Unidades comunes y sus variantes
UNIDADES = {
    'm': ['metro', 'ml', 'm.', 'metros'],
    'm2': ['m²', 'metro cuadrado', 'metros cuadrados', 'mc'],
    'm3': ['m³', 'metro cubico', 'metros cubicos'],
    'ud': ['unidad', 'unidades', 'u', 'uds'],
    'kg': ['kilogramo', 'kilogramos', 'kilo'],
    'l': ['litro', 'litros'],
    'h': ['hora', 'horas']
}

def normalizar_texto(texto):
    """Normaliza texto para búsqueda"""
    if not texto:
        return ""

    # Convertir a minúsculas
    texto = texto.lower()

    # Eliminar acentos
    reemplazos = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'ñ': 'n', 'ü': 'u'
    }
    for old, new in reemplazos.items():
        texto = texto.replace(old, new)

    # Eliminar caracteres especiales pero mantener espacios
    texto = re.sub(r'[^\w\s]', ' ', texto)

    # Comprimir espacios múltiples
    texto = re.sub(r'\s+', ' ', texto).strip()

    return texto

def extraer_palabras_clave(texto):
    """Extrae palabras clave relevantes"""
    # Palabras vacías a ignorar
    stopwords = {
        'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'en', 'con', 'para', 'por', 'sin', 'sobre', 'a', 'o', 'y', 'e',
        'incluido', 'incluso', 'mediante', 'segun', 'hasta'
    }

    palabras = normalizar_texto(texto).split()
    return [p for p in palabras if p not in stopwords and len(p) > 2]

def expandir_con_sinonimos(termino):
    """Expande un término con sus sinónimos y categorías"""
    termino_norm = normalizar_texto(termino)
    terminos_expandidos = {termino_norm}

    # Buscar en categorías semánticas
    for categoria_key, info in CATEGORIAS_SEMANTICAS.items():
        if termino_norm in info['terminos'] or termino_norm == categoria_key:
            terminos_expandidos.add(categoria_key)
            terminos_expandidos.update(info['terminos'])

    return list(terminos_expandidos)

def crear_indice_invertido(partidas):
    """Crea índice invertido optimizado"""
    print("\n[INFO] Creando índice invertido...")

    indice = {
        'palabras': defaultdict(list),      # palabra -> [indices de partidas]
        'categorias': defaultdict(list),    # categoria -> [indices de partidas]
        'codigos': {},                      # codigo -> indice de partida
        'unidades': defaultdict(list),      # unidad -> [indices de partidas]
        'rangos_precio': {}                 # rango -> [indices de partidas]
    }

    # Definir rangos de precio
    rangos = [
        (0, 10, 'economico'),
        (10, 50, 'medio'),
        (50, 200, 'alto'),
        (200, float('inf'), 'premium')
    ]

    for rango_min, rango_max, nombre in rangos:
        indice['rangos_precio'][nombre] = []

    for idx, partida in enumerate(partidas):
        # Indexar por código
        codigo = partida.get('cod', '')
        if codigo:
            indice['codigos'][normalizar_texto(codigo)] = idx

        # Indexar por palabras clave
        resumen = partida.get('res', '')
        descripcion = partida.get('desc', '')

        palabras = set()
        palabras.update(extraer_palabras_clave(resumen))
        palabras.update(extraer_palabras_clave(descripcion))

        for palabra in palabras:
            # Palabra original
            indice['palabras'][palabra].append(idx)

            # Expandir con sinónimos
            for sinonimo in expandir_con_sinonimos(palabra):
                indice['palabras'][sinonimo].append(idx)

        # Indexar por categoría semántica
        texto_completo = normalizar_texto(resumen + ' ' + descripcion)
        for categoria_key, info in CATEGORIAS_SEMANTICAS.items():
            if categoria_key in texto_completo or any(t in texto_completo for t in info['terminos']):
                indice['categorias'][info['categoria']].append(idx)

        # Indexar por unidad
        unidad = normalizar_texto(partida.get('uni', ''))
        if unidad:
            indice['unidades'][unidad].append(idx)

        # Indexar por rango de precio
        precio = float(partida.get('pre', 0))
        for rango_min, rango_max, nombre in rangos:
            if rango_min <= precio < rango_max:
                indice['rangos_precio'][nombre].append(idx)
                break

    # Convertir defaultdict a dict normal para JSON
    indice_final = {
        'palabras': dict(indice['palabras']),
        'categorias': dict(indice['categorias']),
        'codigos': indice['codigos'],
        'unidades': dict(indice['unidades']),
        'rangos_precio': indice['rangos_precio']
    }

    # Estadísticas
    print(f"  OK Palabras indexadas: {len(indice_final['palabras']):,}")
    print(f"  OK Categorías: {len(indice_final['categorias'])}")
    print(f"  OK Códigos únicos: {len(indice_final['codigos']):,}")
    print(f"  OK Unidades: {len(indice_final['unidades'])}")

    return indice_final

def crear_metadata(partidas):
    """Crea metadata para optimizar búsquedas"""
    print("\n[INFO] Generando metadata...")

    metadata = {
        'total_partidas': len(partidas),
        'categorias_semanticas': list(CATEGORIAS_SEMANTICAS.keys()),
        'estadisticas': {
            'con_precio': sum(1 for p in partidas if p.get('pre', 0) > 0),
            'sin_precio': sum(1 for p in partidas if p.get('pre', 0) == 0)
        },
        'precio_min': min((p.get('pre', 0) for p in partidas if p.get('pre', 0) > 0), default=0),
        'precio_max': max((p.get('pre', 0) for p in partidas if p.get('pre', 0) > 0), default=0),
        'unidades_disponibles': list(set(p.get('uni', '') for p in partidas if p.get('uni')))
    }

    print(f"  OK Total partidas: {metadata['total_partidas']:,}")
    print(f"  OK Con precio: {metadata['estadisticas']['con_precio']:,}")
    print(f"  OK Precio rango: {metadata['precio_min']:.2f} - {metadata['precio_max']:.2f} EUR")

    return metadata

def main():
    print("="*70)
    print("GENERADOR DE ÍNDICE INVERTIDO PARA BÚSQUEDA SEMÁNTICA")
    print("="*70)

    # Cargar base de precios
    ruta_base = Path(__file__).parent.parent / 'data' / 'base-precios.json'

    if not ruta_base.exists():
        print(f"\n[ERROR] No se encuentra: {ruta_base}")
        print("Ejecuta desde la raíz del proyecto.")
        return

    print(f"\n[INFO] Cargando base de precios desde: {ruta_base}")

    with open(ruta_base, 'r', encoding='utf-8') as f:
        partidas = json.load(f)

    print(f"[OK] Cargadas {len(partidas):,} partidas")

    # Crear índice invertido
    indice = crear_indice_invertido(partidas)

    # Crear metadata
    metadata = crear_metadata(partidas)

    # Guardar índice
    ruta_indice = Path(__file__).parent.parent / 'data' / 'indice-busqueda.json'

    print(f"\n[INFO] Guardando índice en: {ruta_indice}")

    with open(ruta_indice, 'w', encoding='utf-8') as f:
        json.dump({
            'indice': indice,
            'metadata': metadata,
            'categorias_semanticas': CATEGORIAS_SEMANTICAS
        }, f, ensure_ascii=False, indent=2)

    # Tamaño del archivo
    tamaño_mb = ruta_indice.stat().st_size / (1024 * 1024)

    print(f"\n[OK] Índice generado exitosamente")
    print(f"[OK] Tamaño: {tamaño_mb:.2f} MB")
    print(f"[OK] Archivo: {ruta_indice}")

    # Mostrar ejemplos de búsqueda
    print("\n" + "="*70)
    print("EJEMPLOS DE BÚSQUEDA MEJORADA:")
    print("="*70)

    ejemplos = [
        ("demolicion arcos", "Expandirá a: demoler, derribo, desmontaje, etc."),
        ("tuberia agua", "Encontrará: fontanería, abastecimiento, ACS, etc."),
        ("excavacion zanja", "Incluirá: movimiento tierras, vaciado, etc."),
        ("pavimento", "Mostrará: solado, baldosa, cerámica, etc.")
    ]

    for busqueda, explicacion in ejemplos:
        print(f"\n[BUSQUEDA] \"{busqueda}\"")
        print(f"   -> {explicacion}")

if __name__ == '__main__':
    main()
