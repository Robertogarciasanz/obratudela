"""
Avisa a los buscadores (Bing, Yandex, Seznam, Naver... y a través de Bing,
ChatGPT y Copilot) de que han cambiado páginas de la web, con IndexNow.

Uso, después de publicar cambios (git push):

    python scripts/avisar-buscadores.py                      # todas las del sitemap
    python scripts/avisar-buscadores.py /llms.txt /pages/api-agentes.html

La clave de IndexNow es el archivo <clave>.txt de la raíz de la web: su
nombre y su contenido son la clave. Es pública por diseño (así se demuestra
que la web es nuestra); no es una contraseña.
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
WEB = 'https://www.obratudela.com'


def clave():
    for f in RAIZ.glob('*.txt'):
        if re.fullmatch(r'[0-9a-f]{32}', f.stem) and f.read_text(encoding='utf-8').strip() == f.stem:
            return f.stem
    sys.exit('No encuentro el archivo de clave de IndexNow (<32 hex>.txt) en la raíz')


def urls_del_sitemap():
    texto = (RAIZ / 'sitemap.xml').read_text(encoding='utf-8')
    return re.findall(r'<loc>\s*(.*?)\s*</loc>', texto)


def main():
    k = clave()
    if len(sys.argv) > 1:
        urls = [u if u.startswith('http') else WEB + u for u in sys.argv[1:]]
    else:
        urls = urls_del_sitemap() + [WEB + '/llms.txt']
    datos = {
        'host': 'www.obratudela.com',
        'key': k,
        'keyLocation': f'{WEB}/{k}.txt',
        'urlList': urls[:10000]
    }
    peticion = urllib.request.Request(
        'https://api.indexnow.org/indexnow',
        data=json.dumps(datos).encode('utf-8'),
        headers={'Content-Type': 'application/json; charset=utf-8'}
    )
    try:
        with urllib.request.urlopen(peticion, timeout=30) as r:
            print(f'IndexNow: {r.status} (aceptado) — {len(urls)} direcciones avisadas')
    except urllib.error.HTTPError as e:
        print(f'IndexNow: {e.code} {e.reason}')
        print('  200/202 = bien; 403 = la clave no se encuentra en la web; 422 = direcciones de otro dominio')


if __name__ == '__main__':
    main()
