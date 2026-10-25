"""Imagen sombreada (aspecto de pieza real) de un solido de CadQuery, sin programas externos.

    from render import render
    img = render(solido, (1, -1, 1))      # PIL.Image RGBA con fondo transparente
    img.save('pieza.png')

Triangula el solido, lo proyecta en la misma direccion que hlr.proyectar, lo pinta con
z-buffer e iluminacion suave, y encima dibuja las aristas visibles en gris oscuro.
"""
import numpy as np
from PIL import Image, ImageDraw

from hlr import marco, proyectar


def _unit(v):
    v = np.asarray(v, float)
    return v / np.linalg.norm(v)


def render(solido, d, up=(0, 0, 1), ancho_px=1600, color=(0.66, 0.70, 0.78), aristas=True,
           tolerancia=0.05, margen=0.04, sobremuestreo=2):
    forma = solido.val() if hasattr(solido, 'val') else solido
    vs, tris = forma.tessellate(tolerancia, 0.2)
    V = np.array([v.toTuple() for v in vs], float)
    T = np.array(tris, int)
    dd, x, y = marco(d, up)

    # coordenadas de pantalla y profundidad (mayor = mas cerca del observador)
    P = np.c_[V @ x, V @ y]
    Z = V @ dd
    pmin, pmax = P.min(0), P.max(0)
    W = ancho_px * sobremuestreo
    esc = W * (1 - 2 * margen) / (pmax[0] - pmin[0])
    H = int((pmax[1] - pmin[1]) * esc + 2 * margen * W)
    off = np.array([margen * W, margen * W])

    def pix(q):
        q = (np.asarray(q, float) - pmin) * esc + off
        return np.c_[q[..., 0], H - q[..., 1]] if q.ndim > 1 else np.array([q[0], H - q[1]])

    S = pix(P)

    # normales por triangulo, orientadas hacia el observador
    a, b, c = V[T[:, 0]], V[T[:, 1]], V[T[:, 2]]
    N = np.cross(b - a, c - a)
    N /= np.linalg.norm(N, axis=1)[:, None] + 1e-12
    N[(N @ dd) < 0] *= -1

    # luz principal arriba-izquierda-delante, luz de relleno y luz ambiente
    luz1 = _unit(dd * 0.6 + np.array(up) * 0.9 - x * 0.5)
    luz2 = _unit(dd * 0.8 + x * 0.6)
    k = 0.30 + 0.55 * np.clip(N @ luz1, 0, 1) + 0.20 * np.clip(N @ luz2, 0, 1)
    k = np.clip(k, 0, 1.1)

    zbuf = np.full((H, W), -np.inf)
    img = np.zeros((H, W, 4), float)
    base = np.array(color)
    for t in range(len(T)):
        s = S[T[t]]
        z = Z[T[t]]
        x0, y0 = np.floor(s.min(0)).astype(int)
        x1, y1 = np.ceil(s.max(0)).astype(int)
        x0, y0 = max(x0, 0), max(y0, 0)
        x1, y1 = min(x1, W - 1), min(y1, H - 1)
        if x1 < x0 or y1 < y0:
            continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        (ax, ay), (bx, by), (cx, cy) = s
        den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(den) < 1e-12:
            continue
        w0 = ((by - cy) * (gx - cx) + (cx - bx) * (gy - cy)) / den
        w1 = ((cy - ay) * (gx - cx) + (ax - cx) * (gy - cy)) / den
        w2 = 1 - w0 - w1
        dentro = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
        if not dentro.any():
            continue
        zz = w0 * z[0] + w1 * z[1] + w2 * z[2]
        sub = zbuf[y0:y1 + 1, x0:x1 + 1]
        gana = dentro & (zz > sub)
        if not gana.any():
            continue
        sub[gana] = zz[gana]
        img[y0:y1 + 1, x0:x1 + 1][gana] = np.r_[base * k[t], 1.0]

    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), 'RGBA')

    if aristas:
        lin, _ = proyectar(forma.wrapped, d, up)
        dr = ImageDraw.Draw(im)
        grosor = max(1, int(round(1.2 * sobremuestreo)))
        for clave in ('vis', 'sil'):
            for l in lin[clave]:
                q = pix(np.array(l))
                dr.line([tuple(p) for p in q], fill=(45, 48, 56, 255), width=grosor)

    if sobremuestreo > 1:
        im = im.resize((W // sobremuestreo, H // sobremuestreo), Image.LANCZOS)
    return im
