"""Planos isometricos en PDF (A3 apaisado) a partir de un solido de CadQuery.

Uso basico (ver ejemplos/plano_caja23.py):

    from plano import Hoja
    h = Hoja('pieza.pdf', 'PIEZA', 'Nombre del autor')
    h.marco()
    v = h.vista(solido, (1, -1, 1), 130, 140)      # direccion de vista y centro en la hoja (mm)
    h.cota(v, (-60, -30, 0), (60, -30, 0), (0, -1, 0), 30, '120')
    h.nota(v.P((10, 0, 40)), 20, 15, ['Texto de la nota'])
    h.rotulo(130, 30, 'VISTA ISOMETRICA', '1:1')
    h.notas(236, 100, ['1. Cotas en mm.'])
    h.cajetin(titulo='PIEZA', subtitulo='...', autor='...', fecha='dd/mm/aaaa', plano='pieza-ISO')
    h.guardar()

Unidades: milimetros de la hoja. Las cotas se dan en coordenadas 3D del modelo.
"""
import numpy as np
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm

from hlr import proyectar

NEGRO = (0, 0, 0)
GRIS = (0.5, 0.5, 0.5)
GRIS_TXT = (0.25, 0.25, 0.25)


def unit(v):
    v = np.asarray(v, float)
    n = np.linalg.norm(v)
    return v / n if n else v


class Vista:
    """Proyeccion ortogonal con lineas ocultas eliminadas, colocada en la hoja."""

    def __init__(self, hoja, solido, d, ox, oy, esc=1.0):
        forma = solido.val().wrapped if hasattr(solido, 'val') else solido.wrapped
        self.h = hoja
        self.lin, (self.d, self.x, self.y) = proyectar(forma, d)
        self.o = np.array([ox, oy], float)
        self.e = esc

    def P(self, p):
        """Punto 3D del modelo -> punto de la hoja (mm)."""
        p = np.asarray(p, float)
        return self.o + self.e * np.array([p @ self.x, p @ self.y])

    def D(self, v):
        """Direccion 3D del modelo -> direccion unitaria en la hoja."""
        v = np.asarray(v, float)
        return unit([v @ self.x, v @ self.y])

    def dibujar(self):
        c = self.h.c
        for clave, ancho, col in (('tan', 0.13, GRIS), ('vis', 0.5, NEGRO), ('sil', 0.5, NEGRO)):
            c.setLineWidth(ancho)
            c.setStrokeColorRGB(*col)
            for l in self.lin[clave]:
                pts = [self.o + self.e * np.array(q) for q in l]
                pth = c.beginPath()
                pth.moveTo(*pts[0])
                for q in pts[1:]:
                    pth.lineTo(*q)
                c.drawPath(pth, stroke=1, fill=0)
        c.setStrokeColorRGB(*NEGRO)
        return self


class Hoja:
    W, H = 420, 297

    def __init__(self, ruta, titulo, autor='', asunto=''):
        self.c = canvas.Canvas(ruta, pagesize=(self.W * mm, self.H * mm))
        self.c.setTitle(titulo)
        self.c.setAuthor(autor)
        self.c.setSubject(asunto)
        self.c.scale(mm, mm)
        self.c.setLineCap(1)
        self.c.setLineJoin(1)

    # ------------------------------------------------------------ dibujo basico
    def linea(self, a, b, w=0.18):
        self.c.setLineWidth(w)
        self.c.setStrokeColorRGB(*NEGRO)
        self.c.line(a[0], a[1], b[0], b[1])

    def flecha(self, punta, direc, L=3.0, A=0.5):
        d = unit(direc)
        n = np.array([-d[1], d[0]])
        b = punta - d * L
        p = self.c.beginPath()
        p.moveTo(*punta); p.lineTo(*(b + n * A)); p.lineTo(*(b - n * A)); p.close()
        self.c.setFillColorRGB(*NEGRO)
        self.c.drawPath(p, stroke=0, fill=1)

    def texto_plano(self, txt, base, u, v, h=3.5):
        """Texto en el plano isometrico: u = direccion de la linea, v = direccion de subida."""
        u, v = unit(u), unit(v)
        if u[0] < -1e-6 or (abs(u[0]) < 1e-6 and u[1] < 0):
            u = -u
        if u[0] * v[1] - u[1] * v[0] < 0:
            v = -v
        an = self.c.stringWidth(txt, 'Helvetica', h)
        self.c.saveState()
        self.c.transform(u[0], u[1], v[0], v[1], base[0], base[1])
        self.c.setFont('Helvetica', h)
        self.c.setFillColorRGB(*NEGRO)
        self.c.drawString(-an / 2, 0, txt)
        self.c.restoreState()

    # ------------------------------------------------------------ vistas y cotas
    def vista(self, solido, d, ox, oy, esc=1.0):
        return Vista(self, solido, d, ox, oy, esc).dibujar()

    def cota(self, vs, p1, p2, dir_ext, sep, txt, h=3.5):
        """Cota lineal en 3D: lineas auxiliares en dir_ext y linea de cota a 'sep' mm."""
        p1, p2, e = np.asarray(p1, float), np.asarray(p2, float), unit(dir_ext)
        self.linea(vs.P(p1 + e * 1.5), vs.P(p1 + e * (sep + 2.5)))
        self.linea(vs.P(p2 + e * 1.5), vs.P(p2 + e * (sep + 2.5)))
        d1, d2 = vs.P(p1 + e * sep), vs.P(p2 + e * sep)
        self.linea(d1, d2)
        self.flecha(d1, d1 - d2)
        self.flecha(d2, d2 - d1)
        u, v = unit(d2 - d1), vs.D(e)
        uu = -u if (u[0] < -1e-6 or (abs(u[0]) < 1e-6 and u[1] < 0)) else u
        hacia_fuera = uu[0] * v[1] - uu[1] * v[0] > 0
        mid = (d1 + d2) / 2
        self.texto_plano(txt, mid + v * (1.0 if hacia_fuera else 1.0 + h), u, v, h)

    def nota(self, punto, dx, dy, lineas, izq=False, h=3.0):
        """Linea de referencia: punto de origen (en la hoja), codo horizontal y texto encima."""
        c = self.c
        a = np.asarray(punto, float)
        b = a + np.array([dx, dy])
        c.setFillColorRGB(*NEGRO)
        c.circle(a[0], a[1], 0.5, stroke=0, fill=1)
        self.linea(a, b)
        s = max(c.stringWidth(t, 'Helvetica', h) for t in lineas) + 2
        fin = b + np.array([-s if izq else s, 0])
        self.linea(b, fin)
        x0 = min(b[0], fin[0]) + 1
        c.setFont('Helvetica', h)
        for i, t in enumerate(lineas):
            c.drawString(x0, b[1] + 0.9 + (len(lineas) - 1 - i) * (h + 1.0), t)

    def rotulo(self, x, y, titulo, escala):
        c = self.c
        c.setFont('Helvetica-Bold', 5)
        c.setFillColorRGB(*NEGRO)
        c.drawCentredString(x, y, titulo)
        an = c.stringWidth(titulo, 'Helvetica-Bold', 5)
        c.setLineWidth(0.35)
        c.line(x - an / 2, y - 1.2, x + an / 2, y - 1.2)
        c.setFont('Helvetica', 3.5)
        c.drawCentredString(x, y - 5.5, ('ESCALA ' + escala) if escala[:1].isdigit() else escala.upper())

    def notas(self, x, y, lineas):
        c = self.c
        c.setFont('Helvetica-Bold', 3.5)
        c.setFillColorRGB(*NEGRO)
        c.drawString(x, y, 'NOTAS')
        c.setFont('Helvetica', 3.0)
        for i, t in enumerate(lineas):
            c.drawString(x, y - 5 - i * 4.4, t)

    # ------------------------------------------------------------ marco y cajetin
    def marco(self):
        c = self.c
        c.setStrokeColorRGB(*NEGRO)
        c.setLineWidth(0.7); c.rect(20, 10, 390, 277)
        c.setLineWidth(0.25); c.rect(15, 5, 400, 287)
        c.setFont('Helvetica', 3.5); c.setFillColorRGB(*NEGRO)
        for i in range(8):
            x0 = 20 + i * 390 / 8
            if i:
                c.line(x0, 5, x0, 10); c.line(x0, 287, x0, 292)
            c.drawCentredString(x0 + 390 / 16, 6.3, str(8 - i))
            c.drawCentredString(x0 + 390 / 16, 288.4, str(8 - i))
        for j in range(4):
            y0 = 10 + j * 277 / 4
            if j:
                c.line(15, y0, 20, y0); c.line(410, y0, 415, y0)
            c.drawCentredString(17.5, y0 + 277 / 8 - 1.2, 'ABCD'[j])
            c.drawCentredString(412.5, y0 + 277 / 8 - 1.2, 'ABCD'[j])
        c.setLineWidth(0.7)
        for a, b in (((215, 5), (215, 15)), ((215, 282), (215, 292)), ((15, 148.5), (25, 148.5)), ((405, 148.5), (415, 148.5))):
            c.line(*a, *b)

    def _campo(self, x, y, etiqueta, valor, tam=3.2, negrita=False):
        c = self.c
        c.setFont('Helvetica', 2.2); c.setFillColorRGB(*GRIS_TXT)
        c.drawString(x + 1, y + 5.4, etiqueta)
        c.setFont('Helvetica-Bold' if negrita else 'Helvetica', tam); c.setFillColorRGB(*NEGRO)
        c.drawString(x + 1, y + 1.4, valor)

    def cajetin(self, titulo, subtitulo='', autor='', fecha='', plano='', escala='1:1', material='Sin definir',
                peso='Según material', revision='A', volumen='', tolerancias='Según uso', archivo='',
                vistas=('Isométrica sup.', 'Isométrica inf.'), hoja='1 de 1'):
        c = self.c
        X0, X1, Y0, Y1 = 230, 410, 10, 58
        c.setLineWidth(0.7); c.rect(X0, Y0, X1 - X0, Y1 - Y0)
        c.setLineWidth(0.25)
        for y in (18, 26, 34, 42):
            c.line(X0, y, X1, y)
        for x in (255, 300, 330):
            c.line(x, Y0, x, 42)
        c.line(370, 18, 370, Y1)
        f = self._campo
        f(X0, 34, 'DIBUJADO', autor); f(300, 34, 'FECHA', fecha); f(330, 34, 'FIRMA', '')
        f(X0, 26, 'COMPROBADO', ''); f(300, 26, 'FECHA', ''); f(330, 26, 'MATERIAL', material)
        f(X0, 18, 'ESCALA', escala); f(255, 18, 'FORMATO', 'A3'); f(300, 18, 'UNIDADES', 'mm'); f(330, 18, 'PESO', peso)
        f(X0, Y0, 'N.º DE PLANO', plano, negrita=True); f(300, Y0, 'REVISIÓN', revision); f(330, Y0, 'HOJA', hoja)
        f(370, 34, 'VOLUMEN', volumen); f(370, 26, 'PROYECCIÓN', 'Isométrica')
        f(370, 18, 'TOLERANCIAS', tolerancias); f(370, Y0, 'ARCHIVO', archivo)
        c.setFont('Helvetica', 2.2); c.setFillColorRGB(*GRIS_TXT)
        c.drawString(X0 + 1, 53.6, 'TÍTULO')
        c.drawString(371, 53.6, 'VISTAS')
        c.setFont('Helvetica-Bold', 9); c.setFillColorRGB(*NEGRO)
        c.drawString(X0 + 2, 46, titulo)
        c.setFont('Helvetica', 3.4)
        c.drawString(X0 + 4 + c.stringWidth(titulo, 'Helvetica-Bold', 9), 46.6, subtitulo)
        c.setFont('Helvetica', 3.0)
        for i, t in enumerate(vistas[:2]):
            c.drawString(371, 48.5 - i * 4.5, t)

    def nueva_hoja(self):
        """Termina la hoja actual y empieza otra del mismo tamano."""
        self.c.showPage()
        self.c.scale(mm, mm)
        self.c.setLineCap(1)
        self.c.setLineJoin(1)

    def imagen(self, img, x, y, ancho):
        """Coloca una imagen PIL (p. ej. de render.py) con su esquina inferior izquierda en (x, y) mm."""
        from reportlab.lib.utils import ImageReader
        alto = ancho * img.height / img.width
        self.c.drawImage(ImageReader(img), x, y, ancho, alto, mask='auto')
        return alto

    def guardar(self):
        self.c.showPage()
        self.c.save()
