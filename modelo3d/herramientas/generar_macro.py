#!/usr/bin/env python3
"""Genera una macro de SolidWorks lista para pegar a partir de un archivo de pieza.

El archivo de pieza (ver plantilla_pieza.bas) tiene dos partes separadas por la
linea "' ---- PROCEDIMIENTOS ----": arriba las constantes de la pieza y abajo
Globals y Sub main. Este script las une con SwBiblioteca y revisa el resultado.

Uso:  python generar_macro.py pieza_caja23.bas [--salida caja23_pegar.bas] [--importar]
      --importar  anade la linea "Attribute VB_Name" para usar Archivo > Importar
"""
import argparse
import os
import re
import sys

from revisar_macro import revisar

AQUI = os.path.dirname(os.path.abspath(__file__))
MARCA = "' ---- PROCEDIMIENTOS ----"

INSTRUCCIONES = """' =====================================================================
' {titulo} - MACRO PARA PEGAR EN SOLIDWORKS
' 1. SolidWorks: Herramientas > Macro > Nueva... (guardar como {nombre}.swp)
' 2. En el editor VBA borra TODO lo que haya y pega este texto completo.
' 3. Pulsa F5 con el cursor dentro de "Sub main".
' Generada con generar_macro.py a partir de {origen}.
' ====================================================================="""


def leer(ruta):
    with open(ruta, encoding='utf-8') as f:
        return f.read().replace('\r\n', '\n')


def main():
    ap = argparse.ArgumentParser(description='Une pieza + SwBiblioteca en una macro lista para pegar.')
    ap.add_argument('pieza')
    ap.add_argument('--salida')
    ap.add_argument('--importar', action='store_true')
    a = ap.parse_args()

    pieza = leer(a.pieza)
    if MARCA not in pieza:
        sys.exit(f'Falta la linea separadora "{MARCA}" en {a.pieza} (ver plantilla_pieza.bas).')
    constantes, procedimientos = pieza.split(MARCA, 1)
    nombre = re.sub(r'^pieza_', '', os.path.splitext(os.path.basename(a.pieza))[0])
    salida = a.salida or os.path.join(os.path.dirname(os.path.abspath(a.pieza)), f'{nombre}_pegar.bas')

    decl = leer(os.path.join(AQUI, 'SwBiblioteca_declaraciones.bas'))
    decl = decl[decl.index('Option Explicit'):]
    lib = leer(os.path.join(AQUI, 'SwBiblioteca.bas'))
    lib = lib[lib.index('Private Sub Gv'):]  # sin la cabecera de la biblioteca
    # Mismo orden que la tapa v1 (formato que funciona y que pega el usuario):
    # cabecera -> Option Explicit y variables -> constantes -> Sub main y Globals -> funciones
    lineas = constantes.strip('\n').split('\n')
    k = 0
    while k < len(lineas) and lineas[k].lstrip().startswith("'") and not lineas[k].lstrip().startswith("' ----"):
        k += 1
    cabecera = '\n'.join(lineas[:k]).strip('\n')
    valores = '\n'.join(lineas[k:]).strip('\n')
    partes = []
    if a.importar:
        partes.append(f'Attribute VB_Name = "{nombre.capitalize()}"')
    partes += [
        cabecera or INSTRUCCIONES.format(titulo=nombre.upper(), nombre=nombre, origen=os.path.basename(a.pieza)),
        decl.strip('\n'),
        valores,
        procedimientos.strip('\n'),
        lib.strip('\n'),
    ]
    texto = '\n\n'.join(partes) + '\n'

    # Los acentos en el codigo VBA pueden salir mal segun el sistema: se avisan
    raras = sorted({(n, ch) for n, l in enumerate(texto.splitlines(), 1) for ch in l if ord(ch) > 127})
    with open(salida, 'w', encoding='cp1252', errors='replace', newline='\r\n') as f:
        f.write(texto)

    avisos = revisar(texto)
    n_err = sum(1 for x in avisos if x[0] == 'ERROR')
    print(f'Macro generada: {salida} ({len(texto.splitlines())} lineas)')
    if raras:
        print(f'  Aviso: {len(raras)} caracteres no ASCII (acentos, simbolos); se guardan en Windows-1252.')
    for nivel, n, msg in avisos:
        print(f'  {nivel:5} linea {n:>4}: {msg}')
    print('  Revision: ' + ('sin errores.' if not n_err else f'{n_err} errores, corrigelos antes de pasarla a SolidWorks.'))
    return 1 if n_err else 0


if __name__ == '__main__':
    sys.exit(main())
