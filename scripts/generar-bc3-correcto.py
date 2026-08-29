#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador de archivos BC3 compatible con Presto, Arquímedes, TCQ
Estándar FIEBDC-3/2012
"""

import json
from datetime import datetime

def generar_bc3_ejemplo():
    """Genera un BC3 de ejemplo correcto para validar formato"""

    # Ejemplo de presupuesto
    presupuesto = [
        {'cod': 'E01AD010', 'res': 'DEMOLICION DE FABRICA DE BLOQUE', 'desc': 'Demolición de fábrica de bloque de hormigón de cualquier tipo y espesor, con compresor.', 'uni': 'm3', 'precio': 54.49, 'qty': 10},
        {'cod': 'E01AJ010', 'res': 'DEMOLICION DE CUBIERTA DE TEJA', 'desc': 'Demolición de cubierta de teja de cualquier tipo, con compresor.', 'uni': 'm2', 'precio': 6.66, 'qty': 50},
        {'cod': 'E04AB010', 'res': 'TABIQUE DE LADRILLO HUECO DOBLE', 'desc': 'Tabique de ladrillo hueco doble de 7 cm de espesor.', 'uni': 'm2', 'precio': 24.22, 'qty': 25},
    ]

    return generar_bc3_fiebdc3(presupuesto, 'Presupuesto de Prueba', 'ObraTudela')

def generar_bc3_fiebdc3(partidas, nombre_proyecto='Presupuesto', empresa='ObraTudela'):
    """
    Genera un archivo BC3 según estándar FIEBDC-3/2012

    Formato correcto para Presto, Arquímedes y TCQ
    """

    lineas = []

    # =========================================================================
    # CABECERA DEL ARCHIVO (Obligatorio)
    # =========================================================================
    # Formato: ~V|VERSION|PROGRAMA_GENERADOR|NOMBRE_FICHERO|FECHA|
    fecha = datetime.now().strftime('%d/%m/%Y')
    lineas.append(f'~V|FIEBDC-3/2012|{empresa}|{nombre_proyecto}|{fecha}|')

    # =========================================================================
    # INFORMACIÓN DE CAMBIO (Obligatorio)
    # =========================================================================
    # Formato: ~K|\AÑO\MONEDA\
    # Año actual y moneda EUR
    año = datetime.now().year
    lineas.append(f'~K|\\{año}\\EUR\\')

    # =========================================================================
    # DEFINICIÓN DE CONCEPTOS (Partidas)
    # =========================================================================
    # Formato: ~C|CODIGO|UNIDAD|RESUMEN|PRECIO|FECHA|TIPO|
    # TIPO: 0=sin clasificar, 1=mano de obra, 2=maquinaria, 3=materiales

    for partida in partidas:
        cod = partida['cod']
        uni = partida['uni']
        res = partida['res']
        precio = partida['precio']

        # Línea de concepto
        lineas.append(f'~C|{cod}|{uni}|{res}|{precio:.2f}||0|')

        # Texto descriptivo (opcional pero recomendado)
        if 'desc' in partida and partida['desc']:
            desc = partida['desc'].replace('|', '/')  # Eliminar pipes
            lineas.append(f'~T|{cod}|{desc}|')

    # =========================================================================
    # CAPÍTULO RAÍZ DEL PRESUPUESTO
    # =========================================================================
    # Crear capítulo raíz que contiene todas las partidas
    lineas.append('~C|##||PRESUPUESTO|0||0|')

    # =========================================================================
    # DESCOMPOSICIÓN DEL CAPÍTULO RAÍZ
    # =========================================================================
    # Formato: ~D|CODIGO_PADRE\CODIGO_HIJO|CANTIDAD|PRECIO|
    # Añadir cada partida al capítulo raíz

    for partida in partidas:
        cod = partida['cod']
        qty = partida.get('qty', 1)

        # Relación jerárquica: ## (raíz) contiene cada partida
        lineas.append(f'~D|##\\{cod}|{qty:.3f}||')

    # Unir todas las líneas con saltos de línea
    contenido = '\n'.join(lineas) + '\n'

    return contenido

def validar_bc3(contenido):
    """Valida que el BC3 tenga el formato correcto"""

    lineas = contenido.strip().split('\n')
    errores = []

    # Validar cabecera
    if not lineas[0].startswith('~V|'):
        errores.append('ERROR: Falta cabecera ~V')

    # Validar información de cambio
    if not lineas[1].startswith('~K|'):
        errores.append('ERROR: Falta información de cambio ~K')

    # Contar registros
    conceptos = sum(1 for l in lineas if l.startswith('~C|'))
    descomposiciones = sum(1 for l in lineas if l.startswith('~D|'))
    textos = sum(1 for l in lineas if l.startswith('~T|'))

    print(f"\nESTADÍSTICAS DEL BC3:")
    print(f"  Líneas totales: {len(lineas)}")
    print(f"  Conceptos (~C): {conceptos}")
    print(f"  Descomposiciones (~D): {descomposiciones}")
    print(f"  Textos (~T): {textos}")

    if errores:
        print(f"\nERRORES ENCONTRADOS:")
        for error in errores:
            print(f"  ⚠ {error}")
        return False
    else:
        print(f"\nOK BC3 valido segun FIEBDC-3/2012")
        return True

# ============================================================================
# GENERAR BC3 DE EJEMPLO
# ============================================================================

print("=" * 80)
print("GENERADOR DE BC3 COMPATIBLE - ObraTudela")
print("Estándar FIEBDC-3/2012 para Presto, Arquímedes, TCQ")
print("=" * 80)

# Generar BC3
bc3_contenido = generar_bc3_ejemplo()

# Validar
print("\n[1/2] Validando BC3 generado...")
es_valido = validar_bc3(bc3_contenido)

# Guardar
if es_valido:
    output_path = '../data/ejemplo-bc3-correcto.bc3'
    with open(output_path, 'w', encoding='latin-1') as f:  # BC3 usa Latin-1
        f.write(bc3_contenido)

    print(f"\n[2/2] BC3 guardado en: {output_path}")
    print(f"\nOK Archivo BC3 generado correctamente")
    print(f"  Puedes abrirlo con Presto, Arquímedes o TCQ")
else:
    print(f"\nERROR BC3 tiene errores y no se guardo")

print("\n" + "=" * 80)
print("CONTENIDO DEL BC3:")
print("=" * 80)
print(bc3_contenido)
