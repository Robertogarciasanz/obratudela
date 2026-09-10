#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parser generico del formato FIEBDC-3 (BC3) para bancos de precios de
construccion. Modulo reutilizable, no se ejecuta directamente.

Registros que interpreta:
  ~C|codigo|unidad|resumen|precio|...|   -> definicion de capitulo/partida/recurso
  ~D|padre|hijo1\\f1\\f2\\hijo2\\f1\\f2\\...|
        - si "padre" termina en '#': jerarquia (capitulos/subcapitulos/partidas)
        - si "padre" NO termina en '#': descomposicion de precio (recursos
          que componen la partida, con "f2" = cantidad consumida por unidad)
  ~T|codigo|texto|                       -> texto descriptivo extendido

Un codigo que termina en '#' es siempre un capitulo o subcapitulo. Un codigo
que no termina en '#' es una partida (si tiene su propia descomposicion de
recursos) o un recurso simple/base (mano de obra, maquinaria, material) si
no la tiene.
"""

import re

BACKSLASH = chr(92)


def parse_bc3(path):
    with open(path, 'rb') as f:
        raw = f.read()
    try:
        text = raw.decode('utf-8')
    except UnicodeDecodeError:
        text = raw.decode('latin-1')

    lines = [l for l in re.split(r'\r\n|\n', text) if l]

    conceptos = {}   # codigo -> (unidad, resumen, precio)
    decomp = {}      # padre -> [(hijo, f1, f2), ...]
    textos = {}      # codigo -> texto extendido

    for l in lines:
        if l.startswith('~C|'):
            parts = l.split('|')
            if len(parts) >= 5:
                cod, uni, res, precio = parts[1], parts[2], parts[3], parts[4]
                try:
                    precio_f = float(precio.replace(',', '.'))
                except ValueError:
                    precio_f = 0.0
                conceptos[cod] = (uni, res.strip(), precio_f)
        elif l.startswith('~D|'):
            idx1 = l.find('|', 3)
            if idx1 == -1:
                continue
            parent = l[3:idx1]
            resto = l[idx1 + 1:]
            toks = resto.split(BACKSLASH)
            hijos = []
            i = 0
            while i + 2 < len(toks):
                child, f1, f2 = toks[i], toks[i + 1], toks[i + 2]
                if child:
                    try:
                        f1v = float(f1.replace(',', '.'))
                    except ValueError:
                        f1v = 0.0
                    try:
                        f2v = float(f2.replace(',', '.'))
                    except ValueError:
                        f2v = 0.0
                    hijos.append((child, f1v, f2v))
                i += 3
            if hijos:
                decomp[parent] = hijos
        elif l.startswith('~T|'):
            parts = l.split('|', 2)
            if len(parts) >= 3:
                cod = parts[1]
                texto = parts[2]
                if texto.endswith('|'):
                    texto = texto[:-1]
                texto = re.sub(r'\s+', ' ', texto).strip()
                if texto:
                    textos[cod] = texto

    return conceptos, decomp, textos


def es_capitulo(cod):
    return cod.endswith('#')


def construir_jerarquia(conceptos, decomp):
    """Devuelve parent_of: codigo_hijo -> codigo_capitulo_padre inmediato,
    solo a partir de los enlaces de jerarquia (padre termina en '#').

    OJO: dentro de un registro ~D jerarquico, los capitulos hijos se
    referencian SIN el '#' final (p.ej. "A01AA" en vez de "A01AA#"), aunque
    su definicion ~C si lo lleva. Hay que reconstruirlo."""
    parent_of = {}
    for parent, hijos in decomp.items():
        if not es_capitulo(parent):
            continue
        for child, f1, f2 in hijos:
            real_child = child
            if (child + '#') in conceptos:
                real_child = child + '#'
            parent_of[real_child] = parent
    return parent_of


def ruta_capitulos(cod, parent_of, conceptos, max_niveles=6):
    """Breadcrumb de nombres de capitulo desde la raiz hasta el padre
    inmediato de `cod` (sin incluir el propio `cod`)."""
    cadena = []
    actual = parent_of.get(cod)
    visitados = set()
    while actual and actual not in visitados and len(cadena) < max_niveles:
        visitados.add(actual)
        nombre = conceptos.get(actual, (None, actual, None))[1]
        cadena.append(nombre)
        actual = parent_of.get(actual)
    cadena.reverse()
    return cadena
