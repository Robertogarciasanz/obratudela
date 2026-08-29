#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LIMPIADOR Y OPTIMIZADOR DE BASE DE DATOS DE PRECIOS
Mejora, limpia y optimiza la base de datos de construcción
"""

import json
import re
from collections import defaultdict

print("=" * 80)
print("LIMPIADOR Y OPTIMIZADOR DE BASE DE DATOS - ObraTudela")
print("=" * 80)

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

INPUT_FILE = '../data/base-precios.json'
OUTPUT_FILE = '../data/base-precios.json'
BACKUP_FILE = '../data/base-precios-BACKUP.json'
REPORT_FILE = '../data/informe-limpieza.txt'

# ============================================================================
# FUNCIONES DE LIMPIEZA
# ============================================================================

def limpiar_texto(texto):
    """Limpia y normaliza texto"""
    if not texto:
        return ""

    # Convertir a string
    texto = str(texto)

    # Eliminar espacios múltiples
    texto = re.sub(r'\s+', ' ', texto)

    # Eliminar espacios al inicio y final
    texto = texto.strip()

    # Capitalizar correctamente
    texto = texto.upper()

    # Eliminar caracteres raros
    texto = re.sub(r'[^\w\s\.,;:/()\-áéíóúÁÉÍÓÚñÑ²³°ºª]', '', texto)

    return texto

def limpiar_codigo(codigo):
    """Limpia y normaliza códigos"""
    if not codigo:
        return ""

    codigo = str(codigo).strip().upper()

    # Eliminar caracteres no válidos en códigos
    codigo = re.sub(r'[^\w\.]', '', codigo)

    return codigo

def limpiar_unidad(unidad):
    """Normaliza unidades de medida"""
    if not unidad:
        return "ud"

    unidad = str(unidad).strip().lower()

    # Mapeo de unidades comunes
    unidades_map = {
        'm2': 'm2',
        'm²': 'm2',
        'M2': 'm2',
        'M²': 'm2',
        'm3': 'm3',
        'm³': 'm3',
        'M3': 'm3',
        'M³': 'm3',
        'ml': 'ml',
        'ML': 'ml',
        'metros': 'm',
        'metro': 'm',
        'unidad': 'ud',
        'unidades': 'ud',
        'UD': 'ud',
        'Ud': 'ud',
        'kg': 'kg',
        'KG': 'kg',
        'kilogramo': 'kg',
        't': 't',
        'tn': 't',
        'tonelada': 't',
        'h': 'h',
        'hora': 'h',
        'horas': 'h',
        'dia': 'día',
        'mes': 'mes',
        'año': 'año'
    }

    return unidades_map.get(unidad, unidad)

def validar_precio(precio):
    """Valida y normaliza precio"""
    try:
        precio = float(precio)
        if precio < 0:
            return 0.0
        if precio > 1000000:  # Precio sospechosamente alto
            return 0.0
        return round(precio, 2)
    except:
        return 0.0

def clasificar_categoria(cod, res):
    """Clasifica partida en categoría"""
    cod_upper = cod.upper()
    res_upper = res.upper()

    categorias = {
        'DEMOLICION': {
            'codigos': ['01', 'E01', 'D0', 'U01C'],
            'palabras': ['DEMOLICION', 'DEMOLIC', 'LEVANTADO', 'DESMONTAJE', 'DERRIBO']
        },
        'EXCAVACION': {
            'codigos': ['02', 'E02', 'U02'],
            'palabras': ['EXCAVACION', 'ZANJA', 'VACIADO', 'TIERRA', 'RELLENO', 'COMPACTADO']
        },
        'CIMENTACION': {
            'codigos': ['03', 'E03'],
            'palabras': ['CIMENTACION', 'ZAPATA', 'LOSA', 'HORMIGON LIMPIEZA']
        },
        'ESTRUCTURAS': {
            'codigos': ['04', 'E04', 'H0'],
            'palabras': ['ESTRUCTURA', 'HORMIGON', 'PILAR', 'VIGA', 'FORJADO', 'ENCOFRADO']
        },
        'CUBIERTAS': {
            'codigos': ['05', 'E05', 'Q0'],
            'palabras': ['CUBIERTA', 'TEJA', 'IMPERMEABILIZACION']
        },
        'INSTALACIONES': {
            'codigos': ['06', 'E06', 'I0', '21'],
            'palabras': ['INSTALACION', 'FONTANERIA', 'ELECTRICIDAD', 'SANITARIO', 'LAVABO']
        },
        'REVESTIMIENTOS': {
            'codigos': ['07', 'E07', 'R0'],
            'palabras': ['ENFOSCADO', 'ALICATADO', 'SOLADO', 'PAVIMENTO', 'AZULEJO']
        },
        'URBANIZACION': {
            'codigos': ['U0', 'U1'],
            'palabras': ['BORDILLO', 'ACERA', 'CALZADA', 'PAVIMENTO', 'ARQUETA', 'ALCANTARILLA']
        },
        'JARDINERIA': {
            'codigos': ['F0'],
            'palabras': ['JARDIN', 'CESPED', 'ARBOL', 'PLANTA', 'VEGETAL', 'RIEGO']
        },
        'CARPINTERIA': {
            'codigos': ['L0', 'E10'],
            'palabras': ['PUERTA', 'VENTANA', 'CARPINTERIA']
        },
        'AISLAMIENTO': {
            'codigos': ['N0'],
            'palabras': ['AISLAMIENTO', 'AISLA', 'TERMIC', 'ACUSTIC']
        },
        'MAQUINARIA': {
            'codigos': ['M0', 'MK', 'ME', 'MQ'],
            'palabras': ['ALQUILER', 'RETROEXCAVADORA', 'CAMION', 'DUMPER', 'MAQUINA']
        },
        'MANO_OBRA': {
            'codigos': ['MO', 'TP', 'O0'],
            'palabras': ['OFICIAL', 'PEON', 'AYUDANTE', 'CUADRILLA', 'ESPECIALISTA']
        },
        'MATERIALES': {
            'codigos': ['A0', 'P0', 'MT'],
            'palabras': ['CEMENTO', 'ARENA', 'GRAVA', 'LADRILLO', 'BLOQUE', 'MORTERO']
        },
        'TRANSPORTE': {
            'codigos': ['G01C'],
            'palabras': ['CARGA', 'TRANSPORTE', 'ESCOMBROS', 'RESIDUOS']
        },
        'CONTROL_CALIDAD': {
            'codigos': ['C0'],
            'palabras': ['ENSAYO', 'CONTROL', 'CALIDAD', 'PRUEBA']
        }
    }

    # Buscar por código
    for categoria, config in categorias.items():
        for prefix in config.get('codigos', []):
            if cod_upper.startswith(prefix):
                return categoria

    # Buscar por palabras clave
    for categoria, config in categorias.items():
        for palabra in config.get('palabras', []):
            if palabra in res_upper:
                return categoria

    return 'OTROS'

# ============================================================================
# CARGA Y PROCESAMIENTO
# ============================================================================

print("\n[1/5] Cargando base de datos...")
with open(INPUT_FILE, 'r', encoding='utf-8') as f:
    partidas = json.load(f)

print(f"      Total partidas cargadas: {len(partidas)}")

# Crear backup
print("\n[2/5] Creando backup...")
with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
    json.dump(partidas, f, ensure_ascii=False, indent=2)
print(f"      Backup guardado en: {BACKUP_FILE}")

# Estadísticas
print("\n[3/5] Analizando y limpiando...")

estadisticas = {
    'total_original': len(partidas),
    'duplicados_eliminados': 0,
    'codigos_vacios': 0,
    'precios_invalidos': 0,
    'textos_limpiados': 0,
    'sin_categoria': 0
}

# Limpiar y procesar
partidas_limpias = []
codigos_vistos = set()
categorias_count = defaultdict(int)

for i, partida in enumerate(partidas):
    if (i + 1) % 5000 == 0:
        print(f"      Procesadas {i + 1}/{len(partidas)} partidas...")

    # Extraer datos
    cod = partida.get('cod', '')
    res = partida.get('res', '')
    uni = partida.get('uni', 'ud')
    precio = partida.get('precio', 0)

    # Limpiar código
    cod_limpio = limpiar_codigo(cod)
    if not cod_limpio:
        estadisticas['codigos_vacios'] += 1
        continue

    # Detectar duplicados
    if cod_limpio in codigos_vistos:
        estadisticas['duplicados_eliminados'] += 1
        continue
    codigos_vistos.add(cod_limpio)

    # Limpiar texto
    res_limpio = limpiar_texto(res)
    if res != res_limpio:
        estadisticas['textos_limpiados'] += 1

    # Limpiar unidad
    uni_limpio = limpiar_unidad(uni)

    # Validar precio
    precio_limpio = validar_precio(precio)
    if precio_limpio == 0 and precio != 0:
        estadisticas['precios_invalidos'] += 1

    # Clasificar categoría
    categoria = clasificar_categoria(cod_limpio, res_limpio)
    if categoria == 'OTROS':
        estadisticas['sin_categoria'] += 1
    categorias_count[categoria] += 1

    # Crear partida limpia
    partida_limpia = {
        'cod': cod_limpio,
        'res': res_limpio,
        'uni': uni_limpio,
        'precio': precio_limpio,
        'categoria': categoria
    }

    # Añadir descripción si existe
    if 'desc' in partida and partida['desc']:
        partida_limpia['desc'] = limpiar_texto(str(partida['desc']))

    partidas_limpias.append(partida_limpia)

print(f"      Procesamiento completado!")

# ============================================================================
# ORDENAR Y OPTIMIZAR
# ============================================================================

print("\n[4/5] Ordenando partidas...")

# Ordenar por categoría y luego por código
partidas_limpias.sort(key=lambda x: (x['categoria'], x['cod']))

print(f"      Partidas ordenadas por categoría y código")

# ============================================================================
# GUARDAR RESULTADOS
# ============================================================================

print("\n[5/5] Guardando base de datos optimizada...")

# Guardar JSON compacto (sin espacios)
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(partidas_limpias, f, ensure_ascii=False, separators=(',', ':'))

print(f"      Guardado en: {OUTPUT_FILE}")

# Generar informe
print("\n" + "=" * 80)
print("INFORME DE LIMPIEZA")
print("=" * 80)

informe = f"""
INFORME DE LIMPIEZA Y OPTIMIZACIÓN - ObraTudela
{'=' * 80}

ESTADÍSTICAS GENERALES:
  • Partidas originales:        {estadisticas['total_original']:,}
  • Partidas finales:            {len(partidas_limpias):,}
  • Reducción:                   {estadisticas['total_original'] - len(partidas_limpias):,} partidas

PROBLEMAS CORREGIDOS:
  • Duplicados eliminados:       {estadisticas['duplicados_eliminados']:,}
  • Códigos vacíos eliminados:   {estadisticas['codigos_vacios']:,}
  • Precios inválidos corregidos:{estadisticas['precios_invalidos']:,}
  • Textos limpiados:            {estadisticas['textos_limpiados']:,}

PARTIDAS POR CATEGORÍA:
"""

for categoria, count in sorted(categorias_count.items(), key=lambda x: -x[1]):
    porcentaje = (count / len(partidas_limpias)) * 100
    informe += f"  • {categoria:20s}: {count:6,} ({porcentaje:5.1f}%)\n"

informe += f"\nTOTAL CATEGORIZADO: {len(partidas_limpias):,} partidas\n"
informe += f"Sin categoría asignada: {estadisticas['sin_categoria']:,}\n"

print(informe)

# Guardar informe
with open(REPORT_FILE, 'w', encoding='utf-8') as f:
    f.write(informe)

print(f"\nInforme guardado en: {REPORT_FILE}")

# ============================================================================
# COMPRIMIR
# ============================================================================

print("\n" + "=" * 80)
print("Generando archivos comprimidos...")
print("=" * 80)

import gzip
import brotli

# Leer JSON
with open(OUTPUT_FILE, 'rb') as f:
    data = f.read()

# Comprimir GZIP
with open(OUTPUT_FILE + '.gz', 'wb') as f:
    f.write(gzip.compress(data, compresslevel=9))

# Comprimir Brotli
with open(OUTPUT_FILE + '.br', 'wb') as f:
    f.write(brotli.compress(data, quality=11))

size_json = len(data) / 1024 / 1024
size_gz = len(gzip.compress(data, compresslevel=9)) / 1024 / 1024
size_br = len(brotli.compress(data, quality=11)) / 1024 / 1024

print(f"\nTAMAÑOS DE ARCHIVO:")
print(f"  • JSON:   {size_json:.2f} MB")
print(f"  • GZIP:   {size_gz:.2f} MB ({(size_gz/size_json)*100:.1f}%)")
print(f"  • Brotli: {size_br:.2f} MB ({(size_br/size_json)*100:.1f}%)")

print("\n" + "=" * 80)
print("PROCESO COMPLETADO CON ÉXITO")
print("=" * 80)
print(f"\nBase de datos optimizada: {len(partidas_limpias):,} partidas")
print(f"Tamaño reducido en: {((1 - size_br/size_json)*100):.1f}% (Brotli)")
print("\n")
