#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Busca licitaciones publicas en la Plataforma de Contratacion del Sector
Publico (PLACSP) que lleven adjunto un banco de precios en formato BC3
(FIEBDC-3) -- p.ej. el "cuadro de precios" o "presupuesto" de un proyecto
de obra civil -- y los descarga.

Fuente de datos: el feed ATOM oficial de sindicacion de PLACSP
(licitacionesPerfilesContratanteCompleto v3), publico y sin necesidad de
autenticacion. No es una API de busqueda por palabra clave: se recorren
las licitaciones mas recientes pagina a pagina y se mira, licitacion a
licitacion, si alguno de sus documentos adjuntos termina en ".bc3".

Uso:
  python scripts/buscar-bc3-placsp.py
  python scripts/buscar-bc3-placsp.py --verbose
  python scripts/buscar-bc3-placsp.py --dias 15 --max-expedientes 50 --verbose

Los BC3 encontrados se guardan en data/placsp-descargas/ (no versionado,
igual que el resto de archivos .bc3 del proyecto) junto con un resumen
en data/placsp-descargas/resumen.json.
"""

import argparse
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

FEED_ROOT = (
    'https://contrataciondelestado.es/sindicacion/sindicacion_643/'
    'licitacionesPerfilesContratanteCompleto3.atom'
)
OUT_DIR = os.path.join('data', 'placsp-descargas')
MAX_PAGINAS = 400  # tope de seguridad para no recorrer el feed indefinidamente
USER_AGENT = 'Mozilla/5.0 (compatible; ObraTudela-BuscadorBC3/1.0)'

NS = {
    'atom': 'http://www.w3.org/2005/Atom',
    'cbc': 'urn:dgpe:names:draft:codice:schema:xsd:CommonBasicComponents-2',
    'cac': 'urn:dgpe:names:draft:codice:schema:xsd:CommonAggregateComponents-2',
}

DOC_REF_TAGS = [
    'AdditionalDocumentReference',
    'TechnicalDocumentReference',
    'LegalDocumentReference',
]


def log(msg, verbose, force=False):
    if verbose or force:
        print(msg)


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def sanitizar(nombre, max_len=60):
    nombre = unicodedata.normalize('NFKD', nombre)
    nombre = nombre.encode('ascii', 'ignore').decode('ascii')
    nombre = re.sub(r'[^a-zA-Z0-9._-]+', '_', nombre).strip('_')
    return nombre[:max_len] or 'sin_nombre'


def parsear_resumen(summary_text):
    """El <summary> viene como 'Id licitacion: X; Organo de Contratacion:
    Y; Importe: Z EUR; Estado: W'. Lo partimos en un dict best-effort."""
    campos = {}
    for parte in (summary_text or '').split(';'):
        if ':' not in parte:
            continue
        clave, _, valor = parte.partition(':')
        campos[clave.strip()] = valor.strip()
    return campos


def procesar_entrada(entry, cutoff, encontrados, max_expedientes, verbose, downloads_ok):
    ns = NS
    updated_txt = entry.findtext('atom:updated', default='', namespaces=ns)
    fecha = None
    if updated_txt:
        try:
            fecha = datetime.fromisoformat(updated_txt.replace('Z', '+00:00'))
        except ValueError:
            fecha = None

    if fecha and fecha < cutoff:
        return 'fuera_de_rango', fecha

    titulo = entry.findtext('atom:title', default='(sin titulo)', namespaces=ns)
    summary = entry.findtext('atom:summary', default='', namespaces=ns)
    campos = parsear_resumen(summary)
    expediente = campos.get('Id licitación') or campos.get('Id licitacion') or '(sin id)'
    organo = campos.get('Órgano de Contratación') or campos.get('Organo de Contratacion') or ''
    importe = campos.get('Importe', '')

    bc3_docs = []
    # Buscamos los DocumentReference en cualquier profundidad del entry,
    # sea cual sea el contenedor (LegalDocumentReference, etc.), sin
    # depender de la jerarquia exacta de ContractFolderStatus.
    for tag in DOC_REF_TAGS:
        for doc_ref in entry.iter('{%s}%s' % (ns['cac'], tag)):
            doc_id = doc_ref.findtext('cbc:ID', default='', namespaces=ns)
            if not doc_id.lower().endswith('.bc3'):
                continue
            uri = doc_ref.findtext(
                'cac:Attachment/cac:ExternalReference/cbc:URI', default='', namespaces=ns
            )
            if uri:
                bc3_docs.append({'nombre': doc_id, 'url': uri})

    if not bc3_docs:
        return 'sin_bc3', fecha

    if len(encontrados) >= max_expedientes:
        return 'limite_alcanzado', fecha

    log(f'  -> BC3 encontrado: {expediente} | {organo} | {titulo[:60]}', verbose, force=True)

    archivos_guardados = []
    if downloads_ok:
        os.makedirs(OUT_DIR, exist_ok=True)
        for doc in bc3_docs:
            nombre_archivo = f'{sanitizar(expediente)}_{sanitizar(doc["nombre"])}'
            if not nombre_archivo.lower().endswith('.bc3'):
                nombre_archivo += '.bc3'
            destino = os.path.join(OUT_DIR, nombre_archivo)
            try:
                data = fetch(doc['url'])
                with open(destino, 'wb') as f:
                    f.write(data)
                archivos_guardados.append(destino)
                log(f'     descargado: {destino} ({len(data)/1024:.0f} KB)', verbose, force=True)
            except (urllib.error.URLError, TimeoutError) as err:
                log(f'     ERROR descargando {doc["nombre"]}: {err}', verbose, force=True)

    encontrados.append({
        'expediente': expediente,
        'organo': organo,
        'importe': importe,
        'titulo': titulo,
        'fecha': updated_txt,
        'documentos_bc3': bc3_docs,
        'archivos_guardados': archivos_guardados,
    })
    return 'encontrado', fecha


def main():
    ap = argparse.ArgumentParser(
        description='Busca y descarga bancos de precios BC3 adjuntos en licitaciones de PLACSP.'
    )
    ap.add_argument('--dias', type=int, default=30,
                     help='Solo licitaciones actualizadas en los ultimos N dias (por defecto 30).')
    ap.add_argument('--max-expedientes', type=int, default=20,
                     help='Maximo de licitaciones con BC3 a recoger (por defecto 20).')
    ap.add_argument('--verbose', action='store_true', help='Muestra el progreso pagina a pagina.')
    ap.add_argument('--no-descargar', action='store_true',
                     help='Solo lista lo encontrado, sin descargar los archivos .bc3.')
    args = ap.parse_args()

    cutoff = datetime.now(timezone.utc) - timedelta(days=args.dias)
    print(f'Buscando licitaciones con BC3 desde hace {args.dias} dias '
          f'(a partir de {cutoff.date()}), hasta {args.max_expedientes} expedientes...')

    encontrados = []
    url = FEED_ROOT
    pagina = 0
    entradas_vistas = 0

    while url and pagina < MAX_PAGINAS and len(encontrados) < args.max_expedientes:
        pagina += 1
        log(f'[pagina {pagina}] {url}', args.verbose)
        try:
            raw = fetch(url)
        except (urllib.error.URLError, TimeoutError) as err:
            print(f'ERROR de red en la pagina {pagina}: {err}. Se detiene la busqueda aqui.')
            break

        try:
            root = ET.fromstring(raw)
        except ET.ParseError as err:
            print(f'ERROR: no se pudo parsear XML en la pagina {pagina}: {err}')
            break

        entries = root.findall('atom:entry', NS)
        if not entries:
            log('  (pagina sin entradas, fin del feed)', args.verbose)
            break

        parar = False
        for entry in entries:
            entradas_vistas += 1
            estado, fecha = procesar_entrada(
                entry, cutoff, encontrados, args.max_expedientes, args.verbose,
                downloads_ok=not args.no_descargar,
            )
            if estado == 'fuera_de_rango':
                parar = True
                break
            if estado == 'limite_alcanzado':
                parar = True
                break

        if parar:
            break

        next_link = None
        for link in root.findall('atom:link', NS):
            if link.get('rel') == 'next':
                next_link = link.get('href')
                break
        url = next_link
        time.sleep(0.2)  # cortesia con el servidor

    print()
    print(f'Paginas recorridas: {pagina} | Licitaciones vistas: {entradas_vistas} | '
          f'Con BC3: {len(encontrados)}')

    if encontrados:
        os.makedirs(OUT_DIR, exist_ok=True)
        resumen_path = os.path.join(OUT_DIR, 'resumen.json')
        with open(resumen_path, 'w', encoding='utf-8') as f:
            json.dump(encontrados, f, ensure_ascii=False, indent=2)
        print(f'Resumen guardado en: {resumen_path}')
        print()
        print(f'{"Expediente":<20} {"Importe":>14}  Órgano / Título')
        print('-' * 90)
        for item in encontrados:
            print(f'{item["expediente"]:<20} {item["importe"]:>14}  '
                  f'{item["organo"][:35]} / {item["titulo"][:40]}')
    else:
        print('No se ha encontrado ninguna licitación con BC3 adjunto en ese rango. '
              'Prueba a aumentar --dias.')


if __name__ == '__main__':
    sys.exit(main())
