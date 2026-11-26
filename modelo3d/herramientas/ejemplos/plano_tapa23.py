"""Plano isometrico A3 de la tapa 23 (2 hojas).  Uso:  python plano_tapa23.py tapa23_isometrico.pdf"""
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = [AQUI, os.path.join(AQUI, '..', 'vista_previa')]
from modelo_tapa23 import modelo, PEST_H, ZT, XT, YT  # noqa: E402
from modelo_caja23 import modelo as caja  # noqa: E402
from plano import Hoja  # noqa: E402
from render import render  # noqa: E402

t = modelo()
vol = t.val().Volume() / 1000
h = Hoja(sys.argv[1] if len(sys.argv) > 1 else 'tapa23_isometrico.pdf',
         'Tapa 23 - Plano isometrico', 'Roberto Garcia Sanz', 'Tapa de la caja 120 x 80 x 40')
datos = dict(autor='Roberto García Sanz', fecha='06/10/2026', plano='tapa23-ISO',
             volumen='%.1f cm³' % vol, archivo='tapa23.step')

# ---- hoja 1: isometricas acotadas
h.marco()
v1 = h.vista(t, (1, -1, 1), 132, 150)
h.cota(v1, (-60, -30, PEST_H), (60, -30, PEST_H), (0, -1, 0), 30, '120')
h.cota(v1, (50, -40, PEST_H), (50, 40, PEST_H), (1, 0, 0), 26, '80')
h.cota(v1, (60, 30, PEST_H), (60, 30, ZT), (1, 0, 0), 12, '4')
h.nota(v1.P((-XT, -YT, ZT)), -20, 30, ['4x Ø3,2 pasante, avellanado Ø6 a 90°', 'entre ejes 93,54 x 80,09 (como la caja)'])
h.nota(v1.P((0, -19.5, ZT)), 60, 50, ['8 ranuras 50 x 3, paso 6, R1'])
h.nota(v1.P((57.07, 37.07, ZT)), 18, 10, ['R10 (4 esquinas)'])
h.nota(v1.P((-46, -44, ZT - 2)), -18, -26, ['4x orejeta 7 x 4, R1'], izq=True)
h.rotulo(132, 40, 'VISTA ISOMÉTRICA SUPERIOR', '1:1')
v2 = h.vista(t, (-1, 1, -1), 318, 200)
h.nota(v2.P((0, -38.35 + 0.6, 0)), -36, -48, ['Pestaña de centrado 1,2 x 1,8', 'entra en el rebaje de la caja', 'holgura 0,15 por lado'], izq=True)
h.rotulo(318, 128, 'VISTA ISOMÉTRICA INFERIOR', '1:1')
h.notas(236, 108, [
    '1. Cotas en milímetros. Placa 120 x 80 x 4 más pestaña de 1,8.',
    '2. Taladros en los mismos ejes que la caja 23 (tornillo M3 avellanado).',
    '3. Pestaña inferior: encaja en el rebaje 1,5 x 2 de la caja.',
    '4. Canto superior redondeado R0,8. Romper aristas vivas.',
    '5. Volumen de la pieza: %.1f cm³.' % vol,
    '6. Modelo paramétrico: macro tapa23_v1_pegar.bas (SolidWorks).',
])
h.cajetin('TAPA 23', 'Tapa atornillada de la caja 23', vistas=('Isométrica sup.', 'Isométrica inf.'),
          hoja='1 de 2', **datos)

# ---- hoja 2: imagenes sombreadas (tapa sola y montada sobre la caja)
h.nueva_hoja()
h.marco()
h.imagen(render(t, (1, -1, 1), ancho_px=1500), 30, 150, 170)
h.rotulo(115, 142, 'TAPA - VISTA SOMBREADA', 'sin escala')
montada = caja().union(t.translate((0, 0, 40 - PEST_H)))
h.imagen(render(montada, (1, -1, 1), ancho_px=1500), 225, 120, 170)
h.rotulo(310, 112, 'TAPA MONTADA SOBRE LA CAJA', 'sin escala')
h.cajetin('TAPA 23', 'Tapa atornillada de la caja 23', vistas=('Sombreada', 'Montada en caja'),
          hoja='2 de 2', escala='S/E', **datos)
h.guardar()
print('PDF generado')
