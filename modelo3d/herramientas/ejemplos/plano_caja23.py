"""Plano isometrico A3 de caja23.  Uso:  python plano_caja23.py caja23_isometrico.pdf"""
import math
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = [AQUI, os.path.join(AQUI, '..', 'vista_previa')]
from modelo_caja23 import modelo  # noqa: E402
from plano import Hoja  # noqa: E402

m = modelo()
vol = m.val().Volume() / 1000
h = Hoja(sys.argv[1] if len(sys.argv) > 1 else 'caja23_isometrico.pdf',
         'Caja 23 - Plano isometrico', 'Roberto Garcia Sanz', 'Caja 120 x 80 x 40')
h.marco()

# ---- vista 1: isometrica superior (cara abierta)
v1 = h.vista(m, (1, -1, 1), 132, 140)
S2 = math.sqrt(0.5)
h.cota(v1, (-60, -30, 0), (60, -30, 0), (0, -1, 0), 30, '120')
h.cota(v1, (50, -40, 0), (50, 40, 0), (1, 0, 0), 26, '80')
pc = (-50 - 10 * S2, -30 - 10 * S2)  # silueta de la esquina R10 en esta vista
h.cota(v1, (pc[0], pc[1], 0), (pc[0], pc[1], 40), (-1, -1, 0), 14, '40')
h.nota(v1.P((50 + 10 * S2, 30 + 10 * S2, 40)), 20, 8, ['R10 (4 esquinas ext.)', 'R7 interior'])
h.nota(v1.P((-46.77, -40.045, 40)), -20, 34, ['4x \u00d82,5 prof. 32 (M3 tapa)', 'entre ejes 93,54 x 80,09'])
h.nota(v1.P((-20, 38.5 - 0.75, 40)), 18, 32, ['Rebaje tapa 1,5 x 2'])
h.nota(v1.P((10, 11.25, 30)), -46, 64, ['Compartimento 75 x 25', 'a 32 del borde izq.', 'tabiques 1,5 x h30'], izq=True)
h.nota(v1.P((12, 5.75, 20)), 66, 38, ['Alojamiento 35 x 35', 'a 40 del borde dcho.', 'cuna R16 prof. 4'])
h.nota(v1.P((60, -3.5, 10.5)), 30, -16, ['2x ventana 11 x 13, R2', 'a 24 del borde abierto'])
h.nota(v1.P((-46, -44, 14)), -16, -30, ['4x orejeta 7 x 4, R1'], izq=True)
h.rotulo(132, 30, 'VISTA ISOMÉTRICA SUPERIOR', '1:1')

# ---- vista 2: isometrica inferior
v2 = h.vista(m, (-1, 1, -1), 318, 198)
h.nota(v2.P((10, 24.5, 0)), -30, -64, ['Ventana pantalla 70 x 20', 'marco 2,5, escalón 1'], izq=True)
h.nota(v2.P((-60, 0, 10.5)), 14, 38, ['Ventana lateral izq.', '11 x 13, R2'], izq=True)
h.rotulo(318, 118, 'VISTA ISOMÉTRICA INFERIOR', '1:1')

h.notas(236, 100, [
    '1. Cotas en milímetros. Dimensiones generales 120 x 80 x 40.',
    '2. Espesor de pared y fondo 3 mm, salvo indicación.',
    '3. Taladros Ø2,5 para tornillo M3 autorroscante.',
    '4. Rebarbar y romper aristas vivas.',
    '5. Volumen de la pieza: %.1f cm³.' % vol,
    '6. Modelo paramétrico: macro caja23_v5_pegar.bas (SolidWorks).',
])
h.cajetin('CAJA 23', 'Caja 120 x 80 x 40 con tapa atornillada', autor='Roberto García Sanz',
          fecha='06/10/2026', plano='caja23-ISO', volumen='%.1f cm³' % vol, archivo='caja23.step', hoja='1 de 2')

# ---- hoja 2: imagen sombreada de la pieza (aspecto real)
from render import render  # noqa: E402
h.nueva_hoja()
h.marco()
alto = h.imagen(render(m, (1, -1, 1), ancho_px=1800), 30, 72, 205)
h.rotulo(132, 64, 'VISTA SOMBREADA SUPERIOR', 'sin escala')
h.imagen(render(m, (-1, 1, -1), ancho_px=1200), 245, 128, 150)
h.rotulo(320, 120, 'VISTA SOMBREADA INFERIOR', 'sin escala')
h.cajetin('CAJA 23', 'Caja 120 x 80 x 40 con tapa atornillada', autor='Roberto García Sanz',
          fecha='06/10/2026', plano='caja23-ISO', volumen='%.1f cm³' % vol, archivo='caja23.step',
          vistas=('Sombreada sup.', 'Sombreada inf.'), hoja='2 de 2', escala='S/E')
h.guardar()
print('PDF generado')
