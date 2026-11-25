"""
Calcula la superficie (mm²) de cada pieza STL de la bici de cenital.org y la
guarda en api-agentes/bici-superficies.js, que usa la API para estimar cuánto
plástico va en las paredes al imprimir una pieza.

Uso (cuando cambien las piezas de la bici):

    python scripts/generar-superficies-bici.py "<carpeta public/bici del proyecto cenital>"

Lee datos.json de esa carpeta y cada STL que indica. Sin librerías externas.
"""
import json
import math
import struct
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / 'api-agentes' / 'bici-superficies.js'


def triangulos(ruta):
    datos = ruta.read_bytes()
    # STL binario: cabecera de 80 bytes + número de triángulos + 50 bytes por triángulo
    if len(datos) >= 84:
        n = struct.unpack_from('<I', datos, 80)[0]
        if 84 + n * 50 == len(datos):
            for i in range(n):
                v = struct.unpack_from('<12f', datos, 84 + i * 50)
                yield v[3:6], v[6:9], v[9:12]
            return
    # STL de texto
    vertices = []
    for linea in datos.decode('utf-8', 'ignore').splitlines():
        partes = linea.split()
        if partes and partes[0] == 'vertex':
            vertices.append(tuple(map(float, partes[1:4])))
            if len(vertices) == 3:
                yield tuple(vertices)
                vertices = []


def superficie(ruta):
    total = 0.0
    for a, b, c in triangulos(ruta):
        u = (b[0] - a[0], b[1] - a[1], b[2] - a[2])
        w = (c[0] - a[0], c[1] - a[1], c[2] - a[2])
        x = u[1] * w[2] - u[2] * w[1]
        y = u[2] * w[0] - u[0] * w[2]
        z = u[0] * w[1] - u[1] * w[0]
        total += math.sqrt(x * x + y * y + z * z) / 2
    return total


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    carpeta = Path(sys.argv[1])
    piezas = json.loads((carpeta / 'datos.json').read_text(encoding='utf-8'))['piezas']
    resultado = {}
    for p in piezas:
        ruta = carpeta / p['stl']
        if ruta.exists():
            resultado[p['id']] = round(superficie(ruta), 1)
    DESTINO.write_text(
        '// Generado por scripts/generar-superficies-bici.py: superficie de cada pieza en mm².\n'
        '// No editar a mano.\n'
        'export default ' + json.dumps(resultado, ensure_ascii=False, indent=0) + ';\n',
        encoding='utf-8'
    )
    print(f'{len(resultado)} de {len(piezas)} piezas -> {DESTINO.relative_to(RAIZ)}')


if __name__ == '__main__':
    main()
