"""Modelo de comprobacion de la tapa 23 (misma geometria que pieza_tapa23.bas) y prueba de montaje con la caja."""
import cadquery as cq

from modelo_caja23 import box, cyl, fil, vert_at, corners

L, H, T, PEST_H, HOLG = 120, 80, 4, 1.8, 0.15
E, WR, RINT = 3, 1.5, 7
PXO, PYO = L / 2 - E + WR - HOLG, H / 2 - E + WR - HOLG     # 58.35 x 38.35
PXI, PYI = L / 2 - E + HOLG, H / 2 - E + HOLG               # 57.15 x 37.15
XT, YT = L / 2 - 13.23, 80.09 / 2                           # ejes de los taladros
ZT = PEST_H + T


def modelo():
    s = box(-60, -40, PEST_H, 60, 40, ZT)
    for sx in (-1, 1):
        for sy in (-1, 1):
            y0, y1 = (36, 44) if sy > 0 else (-44, -36)
            s = s.union(box(sx * 46 - 3.5, y0, PEST_H, sx * 46 + 3.5, y1, ZT))
    s = s.union(box(-PXO, -PYO, 0, PXO, PYO, PEST_H).cut(box(-PXI, -PYI, -1, PXI, PYI, PEST_H + 1)))
    for x, y in corners(XT, YT):
        s = s.cut(cyl(1.6, 20, x, y, -5))
        # avellanado a 45 grados: cono de diametro 6 en la cara superior
        s = s.cut(cq.Solid.makeCone(1.6, 3.0, 1.4, cq.Vector(x, y, ZT - 1.4)))
    for i in range(8):
        y0 = -(7 * 6) / 2 + i * 6 - 1.5
        s = s.cut(box(-25, y0, -1, 25, y0 + 3, 20))
    s = fil(s, 10, vert_at(corners(60, 40)))
    s = fil(s, RINT + WR - HOLG, vert_at(corners(PXO, PYO)))
    s = fil(s, RINT + HOLG, vert_at(corners(PXI, PYI)))
    s = fil(s, 1, vert_at([(sx * x, sy * 44) for sx in (-1, 1) for sy in (-1, 1) for x in (42.5, 49.5)]))
    ran = []
    for i in range(8):
        y0 = -(7 * 6) / 2 + i * 6 - 1.5
        ran += [(-25, y0), (25, y0), (-25, y0 + 3), (25, y0 + 3)]
    s = fil(s, 1, vert_at(ran))
    try:
        s = s.faces(cq.selectors.NearestToPointSelector((0, -39.9, ZT))).edges('not %CIRCLE').fillet(0.8)
    except Exception as ex:  # el canto superior es solo estetico
        print('canto superior sin redondear:', ex)
    return s


if __name__ == '__main__':
    from modelo_caja23 import modelo as caja
    t = modelo()
    print('tapa: solidos', len(t.solids().vals()), 'valido', t.val().isValid(), 'vol', round(t.val().Volume() / 1000, 1), 'cm3')
    c = caja()
    # la cara de apoyo de la tapa (Z = PEST_H) se apoya en el borde de la caja (Z = 40)
    montada = t.translate((0, 0, 40 - PEST_H))
    choque = c.intersect(montada).val().Volume()
    print('choque caja-tapa: %.4f mm3' % choque)
    cq.exporters.export(t, 'tapa23.step')
    cq.exporters.export(c.union(montada), 'caja23_montada.step')
