#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ordena los BC3 de licitaciones y prepara las paginas para la web.

Uso:
  python scripts/generar-licitaciones.py
  python scripts/generar-licitaciones.py --origen F:\\presupuestos\\placsp-descargas --destino F:\\presupuestos\\licitaciones

Lee los .bc3 y resumen.json de --origen (lo que deja buscar-bc3-placsp.py) y crea en --destino:
  indice.csv                 control en Excel (todas, con la columna "estado")
  <ano>/<expediente_titulo>/ original.bc3, partidas.csv, datos.json
  web/licitaciones/          lo unico que se subiria a la web (index.html, una pagina por licitacion y descargas)
No modifica los originales ni sube nada. Solo van a la web las licitaciones con organismo, expediente y partidas.
"""
import argparse
import csv
import hashlib
import html
import json
import os
import re
import shutil
import sys
import unicodedata

URL_WEB = 'https://www.obratudela.com/licitaciones/'
CORREO = re.compile(rb'[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,80}\.[A-Za-z]{2,10}')   # con tope: sin el se atasca
DNI = re.compile(rb'\b(?:\d{8}[A-HJ-NP-TV-Z]|[XYZ]\d{7}[A-Z])\b')


def leer_bc3(ruta):
  """Devuelve (conceptos, descomposicion, textos). conceptos: codigo -> (unidad, resumen, precio)."""
  crudo = open(ruta, 'rb').read()
  cab = crudo[:600].split(b'~', 2)
  juego = cab[1] if len(cab) > 1 and cab[1].startswith(b'V') else b''
  campos = juego.split(b'|')
  marca = campos[5].strip().upper() if len(campos) > 5 else b''
  codif = {b'850': 'cp850', b'437': 'cp437', b'ANSI': 'cp1252'}.get(marca)
  try:
    texto = crudo.decode('utf-8')
  except UnicodeDecodeError:
    texto = crudo.decode(codif or 'cp1252', errors='replace')
  conceptos, desc, textos = {}, {}, {}
  for reg in texto.split('~'):
    reg = reg.replace('\r', '').rstrip('\n\x1a ')
    p = reg.split('|')
    if p[0] == 'C' and len(p) >= 5:
      cod = p[1].split('\\')[0].strip()
      conceptos[cod] = (p[2].strip(), ' '.join(p[3].split()), numero(p[4].split('\\')[0]))
    elif p[0] == 'D' and len(p) >= 3:
      t = p[2].replace('\n', '').split('\\')
      hijos = [(t[i].strip(), numero(t[i + 1], 1.0), numero(t[i + 2], 1.0))
               for i in range(0, len(t) - 2, 3) if t[i].strip()]
      desc.setdefault(p[1].split('\\')[0].strip(), []).extend(hijos)
    elif p[0] == 'T' and len(p) >= 3:
      textos[p[1].split('\\')[0].strip()] = ' '.join(p[2].split())
  return conceptos, desc, textos


def numero(s, defecto=0.0):
  try:
    return float(s.strip().replace(',', '.'))
  except ValueError:
    return defecto


def indirectos(ruta):
  """Porcentaje de costes indirectos del registro ~K (0 si no lo trae)."""
  crudo = open(ruta, 'rb').read()
  m = re.search(rb'~K\|[^|~]*\|([^\\|~]*)', crudo)
  return numero(m.group(1).decode('ascii', 'ignore')) if m else 0.0


def arbol(conceptos, desc, textos, ci=0.0):
  """Recorre desde la raiz (##) y devuelve (capitulos de primer nivel, partidas, total declarado)."""
  def clave(c):
    for k in (c, c + '#', c.rstrip('#'), c + '##'):
      if k in conceptos or k in desc:
        return k
    return c
  raiz = next((c for c in conceptos if c.endswith('##')), None)
  if raiz is None:
    return [], [], 0.0
  partidas, caps = [], []

  def baja(cod, ruta, mult, visto):
    suma = 0.0
    for hijo, factor, rend in desc.get(clave(cod), []):
      k = clave(hijo)
      uni, res, precio = conceptos.get(k, ('', hijo, 0.0))
      cant = factor * rend
      if k.endswith('#'):
        if k in visto:
          continue
        sub = baja(k, ruta + [res], mult * (cant or 1.0), visto | {k})
        if not ruta:
          caps.append({'codigo': k.rstrip('#'), 'resumen': res, 'importe': round(sub, 2)})
        suma += sub
      elif '%' not in k:
        if ci:   # Presto suma los indirectos al precio unitario de cada partida
          precio = round(precio * (1 + ci / 100) + 1e-9, 2)
        importe = round(cant * precio + 1e-9, 2) * mult
        partidas.append({'capitulo': ' > '.join(ruta), 'codigo': k, 'unidad': uni, 'resumen': res,
                         'cantidad': round(cant * mult, 4), 'precio': precio, 'importe': round(importe, 2),
                         'descripcion': textos.get(k, '')})
        suma += importe
    return suma

  baja(raiz, [], 1.0, {raiz})
  return caps, partidas, conceptos[raiz][2]


def slug(s, largo):
  s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
  return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:largo].strip('-')


def euros(v):
  return f'{v:,.2f}'.replace(',', ' ').replace('.', ',').replace(' ', '.') + ' €'


def coma(v):
  return str(v).replace('.', ',')


def seguro_excel(s):
  s = str(s)
  return "'" + s if s[:1] in ('=', '+', '-', '@') else s


def pagina(titulo, descripcion, cuerpo, url, extra=''):
  return f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(titulo[:90])}</title>
<meta name="description" content="{html.escape(descripcion[:160])}">
<link rel="canonical" href="{url}">{extra}
<style>body{{font:16px/1.5 system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#222}}
a{{color:#9a4d00}}li{{margin:.9rem 0}}small{{color:#666}}</style>
</head>
<body>
{cuerpo}
<p><small>Datos reutilizados de la Plataforma de Contratación del Sector Público. No es una publicación oficial:
compruebe siempre el anuncio del órgano de contratación.</small></p>
</body>
</html>
'''


def copiar_al_sitio(web, repo, urls):
  """Copia las paginas a <repo>/licitaciones y las anota en sitemap.xml y llms.txt. No hace commit ni sube."""
  dest = os.path.join(repo, 'licitaciones')
  if os.path.isdir(dest):
    shutil.rmtree(dest)
  shutil.copytree(web, dest, ignore=shutil.ignore_patterns('sitemap.xml'))
  ruta = os.path.join(repo, 'sitemap.xml')
  mapa = open(ruta, encoding='utf-8', newline='').read()
  mapa = re.sub(r'[ \t]*<url><loc>' + re.escape(URL_WEB) + r'[^<]*</loc></url>\r?\n', '', mapa)
  nuevas = ''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls)
  open(ruta, 'w', encoding='utf-8', newline='').write(mapa.replace('</urlset>', nuevas + '</urlset>'))
  ruta = os.path.join(repo, 'llms.txt')
  txt = open(ruta, encoding='utf-8', newline='').read()
  if URL_WEB not in txt:
    seccion = ('## Licitaciones públicas (gratis)\n\n'
               f'- [Presupuestos de licitaciones en BC3, CSV y JSON]({URL_WEB}) · [índice JSON]({URL_WEB}indice.json)\n\n')
    txt = txt.replace('## Más información', seccion + '## Más información', 1)
    open(ruta, 'w', encoding='utf-8', newline='').write(txt)
  print('Copiado a', dest)


def main():
  ap = argparse.ArgumentParser()
  ap.add_argument('--origen', default=r'F:\presupuestos\placsp-descargas')
  ap.add_argument('--destino', default=r'F:\presupuestos\licitaciones')
  ap.add_argument('--copiar-en', help='carpeta del repositorio de la web donde copiar las paginas')
  a = ap.parse_args()
  os.makedirs(a.destino, exist_ok=True)
  # los datos de cada licitacion se acumulan: resumen.json se reescribe en cada busqueda
  fichas_ruta = os.path.join(a.destino, 'fichas.json')
  fichas = json.load(open(fichas_ruta, encoding='utf-8')) if os.path.exists(fichas_ruta) else {}
  res = os.path.join(a.origen, 'resumen.json')
  if os.path.exists(res):
    for r in json.load(open(res, encoding='utf-8')):
      urls = r.get('documentos_bc3', [])
      for i, f in enumerate(r.get('archivos_guardados', [])):
        fichas[os.path.basename(f.replace('\\', '/'))] = {
          'expediente': r.get('expediente', ''), 'organismo': r.get('organo', ''),
          'titulo': ' '.join(r.get('titulo', '').split()), 'fecha': r.get('fecha', '')[:10],
          'importe_anuncio': r.get('importe', ''), 'enlace_documento': urls[i]['url'] if i < len(urls) else ''}
  json.dump(fichas, open(fichas_ruta, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

  web = os.path.join(a.destino, 'web', 'licitaciones')
  if os.path.isdir(web):
    shutil.rmtree(web)
  os.makedirs(web)
  filas, publicadas, vistos, carpetas = [], [], {}, set()
  for nombre in sorted(os.listdir(a.origen)):
    if not nombre.lower().endswith('.bc3'):
      continue
    ruta = os.path.join(a.origen, nombre)
    crudo = open(ruta, 'rb').read()
    huella = hashlib.sha1(crudo).hexdigest()
    if huella in vistos:
      filas.append({'archivo': nombre, 'estado': 'repetido de ' + vistos[huella]})
      continue
    vistos[huella] = nombre
    d = fichas.get(nombre, {})
    conceptos, desc, textos = leer_bc3(ruta)
    caps, partidas, total = arbol(conceptos, desc, textos)
    suma = round(sum(p['importe'] for p in partidas), 2)
    ci = indirectos(ruta)
    aplicado = 0.0
    if ci and total and abs(suma - total) > max(1.0, total * 0.005):
      c2, p2, _ = arbol(conceptos, desc, textos, ci)
      s2 = round(sum(p['importe'] for p in p2), 2)
      if abs(s2 - total) < abs(suma - total):
        caps, partidas, suma, aplicado = c2, p2, s2, ci
    personales = len(set(CORREO.findall(crudo))) + len(set(DNI.findall(crudo))) + crudo.count(b'~E|')
    faltas = []
    if not d.get('expediente') or not d.get('organismo'):
      faltas.append('falta ficha (organismo/expediente)')
    if not partidas:
      faltas.append('sin partidas')
    elif total and abs(suma - total) > max(1.0, total * 0.005):
      faltas.append('la suma no cuadra con el total del BC3')
    elif not suma:
      faltas.append('sin precios')
    if personales:
      faltas.append('revisar datos personales')
    ano = (d.get('fecha') or '')[:4] or '_sin_fecha'
    base = slug(d.get('expediente', ''), 30) or slug(os.path.splitext(nombre)[0], 40)
    carpeta = base + '_' + slug(d.get('titulo') or os.path.splitext(nombre)[0], 50)
    n = 2
    while carpeta in carpetas:
      carpeta, n = f'{carpeta}-{n}', n + 1
    carpetas.add(carpeta)
    local = os.path.join(a.destino, ano, carpeta)
    os.makedirs(local, exist_ok=True)
    shutil.copy2(ruta, os.path.join(local, 'original.bc3'))
    datos = dict(d, archivo_origen=nombre, total_bc3=total, suma_partidas=suma, costes_indirectos_pct=aplicado, capitulos=caps, partidas=partidas)
    with open(os.path.join(local, 'datos.json'), 'w', encoding='utf-8') as f:
      json.dump(datos, f, ensure_ascii=False, indent=1)
    with open(os.path.join(local, 'partidas.csv'), 'w', encoding='utf-8-sig', newline='') as f:
      w = csv.writer(f, delimiter=';')
      w.writerow(['capitulo', 'codigo', 'unidad', 'resumen', 'cantidad', 'precio', 'importe', 'descripcion'])
      for p in partidas:
        w.writerow([seguro_excel(p['capitulo']), seguro_excel(p['codigo']), seguro_excel(p['unidad']),
                    seguro_excel(p['resumen']), coma(p['cantidad']), coma(p['precio']), coma(p['importe']),
                    seguro_excel(p['descripcion'])])
    estado = '; '.join(faltas) or 'lista para web'
    filas.append({'archivo': nombre, 'estado': estado, 'fecha': d.get('fecha', ''),
                  'expediente': d.get('expediente', ''), 'organismo': d.get('organismo', ''),
                  'titulo': d.get('titulo', ''), 'importe_anuncio': d.get('importe_anuncio', ''),
                  'total_bc3': coma(total), 'suma_partidas': coma(suma), 'partidas': len(partidas),
                  'carpeta': os.path.join(ano, carpeta)})
    if faltas:
      continue
    dest = os.path.join(web, carpeta)
    shutil.copytree(local, dest)
    url = URL_WEB + carpeta + '/'
    ld = {'@context': 'https://schema.org', '@type': 'Dataset', 'name': d['titulo'][:200],
          'description': f"Presupuesto de la licitacion {d['expediente']} de {d['organismo']} en BC3, CSV y JSON.",
          'url': url, 'identifier': d['expediente'], 'datePublished': d['fecha'], 'inLanguage': 'es',
          'creator': {'@type': 'Organization', 'name': d['organismo']}, 'isAccessibleForFree': True,
          'distribution': [{'@type': 'DataDownload', 'encodingFormat': m, 'contentUrl': url + f}
                           for f, m in (('original.bc3', 'text/plain'), ('partidas.csv', 'text/csv'),
                                        ('datos.json', 'application/json'))]}
    enlace = (f'<p><a href="{html.escape(d["enlace_documento"])}" rel="nofollow">Documento oficial</a></p>'
              if d.get('enlace_documento', '').startswith('https://contrataciondelestado.es/') else '')
    cuerpo = (f'<p><a href="../">← Licitaciones</a></p>\n<h1>{html.escape(d["titulo"])}</h1>\n'
              f'<p>{html.escape(d["organismo"])}<br>Expediente {html.escape(d["expediente"])} · {d["fecha"]}<br>'
              f'{len(partidas)} partidas · presupuesto del BC3: {euros(suma)}</p>\n'
              '<p>Descargar: <a href="original.bc3" download>BC3</a> · <a href="partidas.csv" download>CSV</a> · '
              f'<a href="datos.json" download>JSON</a></p>\n{enlace}')
    script = '\n<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace('<', '\\u003c') + '</script>'
    with open(os.path.join(dest, 'index.html'), 'w', encoding='utf-8') as f:
      f.write(pagina(d['titulo'], ld['description'], cuerpo, url, script))
    publicadas.append(dict(d, carpeta=carpeta, partidas=len(partidas), total=suma))

  publicadas.sort(key=lambda x: x['fecha'], reverse=True)
  lis = ''.join(
    f'<li><a href="{p["carpeta"]}/">{html.escape(p["titulo"][:160])}</a><br><small>{html.escape(p["organismo"])} · '
    f'{p["fecha"]}</small><br><a href="{p["carpeta"]}/original.bc3" download>BC3</a> · '
    f'<a href="{p["carpeta"]}/partidas.csv" download>CSV</a> · <a href="{p["carpeta"]}/datos.json" download>JSON</a></li>\n'
    for p in publicadas)
  with open(os.path.join(web, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(pagina('Licitaciones públicas: presupuestos en BC3, CSV y JSON',
                   'Presupuestos de licitaciones de obra ordenados y descargables en BC3, CSV y JSON.',
                   f'<h1>Licitaciones públicas</h1>\n<p>{len(publicadas)} presupuestos · '
                   f'<a href="indice.json">índice JSON</a></p>\n<ul>\n{lis}</ul>', URL_WEB))
  with open(os.path.join(web, 'indice.json'), 'w', encoding='utf-8') as f:
    json.dump([dict({k: p[k] for k in ('expediente', 'organismo', 'titulo', 'fecha', 'partidas', 'total')},
                    url=URL_WEB + p['carpeta'] + '/') for p in publicadas], f, ensure_ascii=False, indent=1)
  urls = [URL_WEB] + [URL_WEB + p['carpeta'] + '/' for p in publicadas]
  with open(os.path.join(web, 'sitemap.xml'), 'w', encoding='utf-8') as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + ''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls) + '</urlset>\n')
  if a.copiar_en:
    copiar_al_sitio(web, a.copiar_en, urls)
  campos = ['archivo', 'estado', 'fecha', 'expediente', 'organismo', 'titulo', 'importe_anuncio', 'total_bc3',
            'suma_partidas', 'partidas', 'carpeta']
  try:
    with open(os.path.join(a.destino, 'indice.csv'), 'w', encoding='utf-8-sig', newline='') as f:
      w = csv.DictWriter(f, campos, delimiter=';')
      w.writeheader()
      for r in filas:
        w.writerow({k: (seguro_excel(v) if k in ('titulo', 'organismo', 'expediente') else v) for k, v in r.items()})
  except PermissionError:
    sys.exit('Cierra indice.csv en Excel y vuelve a ejecutar.')
  print(f'{len(filas)} BC3, {len(publicadas)} listas para web')
  for r in filas:
    print(f"  {r['estado'][:70]:70s} {r.get('suma_partidas', '')!s:>14s} {r.get('total_bc3', '')!s:>14s}  {r['archivo'][:45]}")


if __name__ == '__main__':
  main()
