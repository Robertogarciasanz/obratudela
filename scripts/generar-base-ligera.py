"""
Regenera data/base-precios-ligero.json a partir de data/base-precios.json.

La base ligera es la misma base de precios pero solo con lo imprescindible,
en filas compactas: [codigo, unidad, precio, resumen, grupo]. Pesa unos 5 MB
en vez de 30; pensada para servicios y agentes de IA que solo necesitan
consultar precios.

Ejecutar cada vez que se cambie data/base-precios.json:

    python scripts/generar-base-ligera.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'data' / 'base-precios.json'
DESTINO = RAIZ / 'data' / 'base-precios-ligero.json'


def main():
    partidas = json.loads(ORIGEN.read_text(encoding='utf-8'))
    filas = [
        [p['cod'], p.get('uni', ''), p.get('precio', 0), p.get('res', ''), p.get('grupo', '')]
        for p in partidas
    ]
    DESTINO.write_text(
        json.dumps(filas, ensure_ascii=False, separators=(',', ':')),
        encoding='utf-8'
    )
    print(f'{len(filas)} partidas -> {DESTINO.relative_to(RAIZ)}')


if __name__ == '__main__':
    main()
