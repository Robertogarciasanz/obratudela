#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Busca archivos BC3 (mediciones/presupuesto de obra, formato FIEBDC-3) en
licitaciones de OBRAS publicadas por la Administracion Publica espanola a
traves de la Plataforma de Contratacion del Sector Publico (PLACSP).

Recorre el feed Atom de sindicacion de licitaciones (formato CODICE),
filtra las que parecen ser de obras (CPV division 45 y/o palabras clave en
el titulo) y, para cada una, abre la pagina del expediente buscando
enlaces que mencionen "BC3". Descarga lo que encuentra en data/bc3-placsp/
y deja un resumen.csv con lo que se ha revisado.

AVISO IMPORTANTE: este script se ha escrito sin poder probarlo contra el
sitio real -- contrataciondelestado.es no era alcanzable desde el entorno
donde se escribio (bloqueado por politica de red). Los nombres exactos de
campos del feed y la estructura de las paginas de PLACSP pueden no
coincidir exactamente. Ejecutalo con --verbose la primera vez; si no
encuentra nada, revisa data/bc3-placsp/_debug/ (paginas guardadas tal
cual se recibieron) para ver que esta pasando y ajustar los patrones de
busqueda de este script.

Uso:
  python scripts/buscar-bc3-placsp.py
  python scripts/buscar-bc3-placsp.py --dias 15 --max-expedientes 50 --verbose
  python scripts/buscar-bc3-placsp.py --feed <url-atom-alternativa>
"""

import argparse
import csv
import datetime
import http.cookiejar
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

FEED_URL_DEFAULT = (
    'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/'
    'licitacionesPerfilesContratanteCompleto3.atom'
)
SALIDA_DEFAULT = 'data/bc3-placsp'
USER_AGENT = 'Mozilla/5.0 (compatible; ObraTudela-BuscadorBC3/1.0)'
ATOM_NS = '{http://www.w3.org/2005/Atom}'

CPV_OBRAS_RE = re.compile(r'\b45\d{6}\b')
PALABRAS_OBRA = (
    'obra', 'obras', 'construccion', 'urbanizacion', 'pavimentacion',
    'movimiento de tierras', 'excavacion', 'demolicion', 'saneamiento',
    'alcantarillado', 'reforma', 'rehabilitacion', 'edificacion',
)

COOKIE_JAR = http.cookiejar.CookieJar()
OPENER = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(COOKIE_JAR))


class ExtractorEnlaces(HTMLParser):
    """Recoge pares (href, texto_visible) de todos los <a> de una pagina."""

    def __init__(self):
        super().__init__()
        self.enlaces = []
        self._href_actual = None
        self._texto_actual = []

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self._href_actual = dict(attrs).get('href')
            self._texto_actual = []

    def handle_data(self, data):
        if self._href_actual is not None:
            self._texto_actual.append(data)

    def handle_endtag(self, tag):
        if tag == 'a' and self._href_actual is not None:
            texto = ''.join(self._texto_actual).strip()
            self.enlaces.append((self._href_actual, texto))
            self._href_actual = None
            self._texto_actual = []


def log(msg, verbose=True):
    if verbose:
        print(msg)


def descargar(url, timeout=30):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with OPENER.open(req, timeout=timeout) as resp:
        return resp.read(), resp.headers


def texto_hijo(entry, nombre_local):
    el = entry.find(f'{ATOM_NS}{nombre_local}')
    return el.text.strip() if el is not None and el.text else None


def primer_link(entry):
    links = entry.findall(f'{ATOM_NS}link')
    for enlace in links:
        if enlace.get('rel') in (None, 'alternate'):
            return enlace.get('href')
    return links[0].get('href') if links else None


def parsear_fecha(texto):
    try:
        return datetime.datetime.fromisoformat(texto.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        return None


def es_obra(entry_xml, titulo):
    if CPV_OBRAS_RE.search(entry_xml):
        return True
    titulo_low = (titulo or '').lower()
    return any(palabra in titulo_low for palabra in PALABRAS_OBRA)


def enlaces_bc3(html_texto):
    parser = ExtractorEnlaces()
    try:
        parser.feed(html_texto)
    except Exception:
        pass
    return [
        (href, texto) for href, texto in parser.enlaces
        if href and 'bc3' in f'{href} {texto}'.lower()
    ]


def parece_bc3(contenido_bytes):
    cabecera = contenido_bytes[:200].decode('latin-1', errors='ignore')
    return cabecera.lstrip().startswith('~V') or '~C|' in cabecera


def slug(texto):
    texto = re.sub(r'[^\w.-]+', '_', (texto or '').strip())
    return texto[:120] or 'expediente'


def guardar_debug(debug_dir, nombre, contenido_bytes):
    os.makedirs(debug_dir, exist_ok=True)
    with open(os.path.join(debug_dir, nombre), 'wb') as f:
        f.write(contenido_bytes)


def cargar_resumen_previo(ruta):
    filas, vistos = [], set()
    if os.path.exists(ruta):
        with open(ruta, newline='', encoding='utf-8') as f:
            lector = csv.reader(f)
            next(lector, None)
            for fila in lector:
                if fila:
                    filas.append(fila)
                    vistos.add(fila[0])
    return filas, vistos


def guardar_resumen(ruta, filas):
    with open(ruta, 'w', newline='', encoding='utf-8') as f:
        escritor = csv.writer(f)
        escritor.writerow(['id', 'titulo', 'actualizado', 'url', 'estado', 'detalle'])
        escritor.writerows(filas)


def intentar_guardar_bc3(url, salida, eid, filas_resumen, titulo, actualizado, verbose):
    try:
        cuerpo, _ = descargar(url)
    except (urllib.error.URLError, urllib.error.HTTPError) as e:
        log(f'    no se pudo descargar {url}: {e}', verbose)
        return False
    if not parece_bc3(cuerpo):
        return False
    ruta = os.path.join(salida, f'{slug(eid)}.bc3')
    with open(ruta, 'wb') as f:
        f.write(cuerpo)
    log(f'    guardado: {ruta}')
    filas_resumen.append([eid, titulo, actualizado, url, 'descargado', ruta])
    return True


def procesar_expediente(eid, titulo, actualizado, href, args, debug_dir, filas_resumen):
    try:
        contenido, _ = descargar(href)
    except (urllib.error.URLError, urllib.error.HTTPError) as e:
        filas_resumen.append([eid, titulo, actualizado, href, 'error', str(e)])
        return 0

    texto = contenido.decode('utf-8', errors='ignore')
    candidatos = enlaces_bc3(texto)

    descargados = 0
    vistos_url = set()

    for href_candidato, _texto in candidatos:
        url_abs = urllib.parse.urljoin(href, href_candidato)
        if url_abs in vistos_url:
            continue
        vistos_url.add(url_abs)

        if intentar_guardar_bc3(url_abs, args.salida, eid, filas_resumen, titulo, actualizado, args.verbose):
            descargados += 1
            continue

        # puede ser una pagina intermedia (ej. contenedor de documentos del
        # expediente) con mas enlaces dentro -- se prueba un nivel mas
        try:
            sub_contenido, _ = descargar(url_abs)
        except (urllib.error.URLError, urllib.error.HTTPError):
            continue
        sub_texto = sub_contenido.decode('utf-8', errors='ignore')
        for href2, _texto2 in enlaces_bc3(sub_texto):
            url2 = urllib.parse.urljoin(url_abs, href2)
            if url2 in vistos_url:
                continue
            vistos_url.add(url2)
            if intentar_guardar_bc3(url2, args.salida, eid, filas_resumen, titulo, actualizado, args.verbose):
                descargados += 1

    if descargados == 0:
        guardar_debug(debug_dir, f'{slug(eid)}.html', contenido)
        estado = 'no-encontrado' if candidatos else 'sin-mencion-bc3'
        filas_resumen.append([eid, titulo, actualizado, href, estado, ''])

    return descargados


def parse_feed_pagina(xml_bytes):
    root = ET.fromstring(xml_bytes)
    entradas = root.findall(f'{ATOM_NS}entry')
    siguiente = None
    for enlace in root.findall(f'{ATOM_NS}link'):
        if enlace.get('rel') == 'next':
            siguiente = enlace.get('href')
    return entradas, siguiente


def parse_args():
    p = argparse.ArgumentParser(
        description='Busca BC3 de licitaciones de obras publicas en PLACSP.')
    p.add_argument('--feed', default=FEED_URL_DEFAULT,
                    help='URL del feed Atom de licitaciones a recorrer')
    p.add_argument('--salida', default=SALIDA_DEFAULT,
                    help='carpeta donde guardar los .bc3 encontrados')
    p.add_argument('--dias', type=int, default=30,
                    help='solo licitaciones actualizadas en los ultimos N dias (0 = sin limite)')
    p.add_argument('--max-paginas', type=int, default=40,
                    help='limite de paginas del feed a recorrer')
    p.add_argument('--max-expedientes', type=int, default=200,
                    help='limite de expedientes de obra a procesar (0 = sin limite)')
    p.add_argument('--pausa', type=float, default=1.0,
                    help='segundos de espera entre peticiones a PLACSP')
    p.add_argument('--verbose', action='store_true')
    return p.parse_args()


def main():
    args = parse_args()
    os.makedirs(args.salida, exist_ok=True)
    debug_dir = os.path.join(args.salida, '_debug')
    resumen_path = os.path.join(args.salida, 'resumen.csv')

    limite_fecha = None
    if args.dias:
        limite_fecha = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=args.dias)

    filas_resumen, vistos = cargar_resumen_previo(resumen_path)

    url_pagina = args.feed
    pagina_num = 0
    expedientes_obra = 0
    encontrados = 0

    while url_pagina and pagina_num < args.max_paginas:
        pagina_num += 1
        log(f'[feed] pagina {pagina_num}: {url_pagina}', args.verbose)
        try:
            contenido, _ = descargar(url_pagina)
        except (urllib.error.URLError, urllib.error.HTTPError) as e:
            log(f'ERROR descargando el feed: {e}')
            break

        try:
            entradas, url_pagina = parse_feed_pagina(contenido)
        except ET.ParseError as e:
            guardar_debug(debug_dir, f'feed-pagina-{pagina_num}.xml', contenido)
            log(f'ERROR: no se pudo interpretar el XML del feed ({e}).')
            log(f'Pagina guardada en {debug_dir} para revisar la estructura real.')
            break

        if not entradas:
            break

        parar = False
        for entry in entradas:
            eid = texto_hijo(entry, 'id')
            titulo = texto_hijo(entry, 'title')
            actualizado = texto_hijo(entry, 'updated')
            href = primer_link(entry)

            if limite_fecha and actualizado:
                fecha = parsear_fecha(actualizado)
                if fecha and fecha < limite_fecha:
                    parar = True
                    break

            if not eid or eid in vistos:
                continue
            vistos.add(eid)

            entry_xml = ET.tostring(entry, encoding='unicode')
            if not es_obra(entry_xml, titulo):
                continue

            expedientes_obra += 1
            log(f'[{expedientes_obra}] obra: {titulo!r}', args.verbose)

            if not href:
                filas_resumen.append([eid, titulo, actualizado, '', 'sin-enlace', ''])
            else:
                try:
                    nuevos = procesar_expediente(eid, titulo, actualizado, href, args, debug_dir, filas_resumen)
                    encontrados += nuevos
                except Exception as e:
                    log(f'  ERROR procesando {href}: {e}')
                    filas_resumen.append([eid, titulo, actualizado, href, 'error', str(e)])
                time.sleep(args.pausa)

            if args.max_expedientes and expedientes_obra >= args.max_expedientes:
                parar = True
                break

        guardar_resumen(resumen_path, filas_resumen)
        if parar:
            break

    log('')
    log(f'Expedientes de obra revisados: {expedientes_obra}')
    log(f'Archivos BC3 descargados: {encontrados}')
    log(f'Resumen: {resumen_path}')
    if encontrados == 0:
        log(f'No se encontro ningun BC3. Revisa {debug_dir} (si existe) y')
        log('ajusta ExtractorEnlaces / es_obra / parece_bc3 segun lo que veas.')


if __name__ == '__main__':
    main()
