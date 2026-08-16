#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extraer descripciones largas del PDF oficial de BCCA y actualizar base-precios.json
"""

import json
import re
import PyPDF2

def extraer_descripciones_pdf(pdf_path):
    """Extrae descripciones del PDF de BCCA"""
    descripciones = {}

    print(f"[INFO] Abriendo PDF: {pdf_path}")
    with open(pdf_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        total_paginas = len(reader.pages)
        print(f"[INFO] Total de páginas: {total_paginas}")

        for i in range(total_paginas):
            if i % 100 == 0:
                print(f"[INFO] Procesando página {i}/{total_paginas}...")

            texto = reader.pages[i].extract_text()

            # Buscar bloques de partidas en el formato:
            # CÓDIGO (ej: 01ALM00006)
            # Seguido de descripción de varias líneas
            # Hasta encontrar la siguiente partida o línea de costes

            # Patrón: código BCCA (2 dígitos + 3 letras + 5 dígitos)
            partidas = re.finditer(r'\b(\d{2}[A-Z]{3}\d{5})\b', texto)

            for match in partidas:
                codigo = match.group(1)
                inicio = match.end()

                # Buscar texto después del código hasta la siguiente sección
                resto_texto = texto[inicio:inicio+500]

                # Extraer descripción (líneas que empiezan con mayúscula o minúscula)
                # Hasta encontrar "Mano de obra", "TOTAL", otro código, etc.
                lineas = resto_texto.split('\n')
                descripcion_lineas = []

                for linea in lineas:
                    linea_limpia = linea.strip()

                    # Parar si encontramos marcadores de fin
                    if not linea_limpia:
                        continue
                    if re.match(r'^(Mano de obr|Maquinaria|Suma la|Costes|TOTAL|Asciende)', linea_limpia):
                        break
                    if re.match(r'^\d{2}[A-Z]{3}\d{5}', linea_limpia):
                        break
                    if re.match(r'^[A-Z]{2}\d{5}', linea_limpia):  # Códigos de componentes
                        break

                    # Si es texto descriptivo, agregarlo
                    if len(linea_limpia) > 10:
                        descripcion_lineas.append(linea_limpia)

                    # Máximo 4 líneas de descripción
                    if len(descripcion_lineas) >= 4:
                        break

                if descripcion_lineas:
                    # Unir líneas y limpiar
                    desc = ' '.join(descripcion_lineas)
                    desc = re.sub(r'\s+', ' ', desc)  # Normalizar espacios
                    desc = desc.strip()

                    # Solo guardar si tiene contenido sustancial
                    if len(desc) > 30 and not desc.startswith('h ') and not desc.startswith('m3 '):
                        descripciones[codigo] = desc

    return descripciones

def main():
    pdf_path = 'bcca-precios-unitarios.pdf'

    print("[INFO] Extrayendo descripciones del PDF oficial de BCCA...")
    descripciones_pdf = extraer_descripciones_pdf(pdf_path)

    print(f"\n[OK] Extraídas {len(descripciones_pdf):,} descripciones del PDF")

    # Cargar base-precios.json
    print("\n[INFO] Cargando base-precios.json...")
    with open('base-precios.json', 'r', encoding='utf-8') as f:
        partidas = json.load(f)

    # Actualizar partidas BCCA con descripciones del PDF
    actualizadas = 0
    es_bcca = lambda cod: re.match(r'^\d{2}[A-Z]{3}\d', cod)

    for partida in partidas:
        if es_bcca(partida['cod']) and partida['cod'] in descripciones_pdf:
            if not partida.get('desc') or len(partida.get('desc', '')) < 20:
                partida['desc'] = descripciones_pdf[partida['cod']]
                actualizadas += 1

    print(f"[OK] Actualizadas {actualizadas:,} partidas BCCA con descripciones del PDF")

    # Estadísticas finales
    total_con_desc = sum(1 for p in partidas if p.get('desc') and len(p.get('desc', '')) > 10)
    porcentaje = (total_con_desc / len(partidas)) * 100

    print(f"\n[RESULTADO]")
    print(f"  Total partidas: {len(partidas):,}")
    print(f"  Con descripción larga: {total_con_desc:,} ({porcentaje:.1f}%)")
    print(f"  Sin descripción: {len(partidas) - total_con_desc:,}")

    if actualizadas > 0:
        print(f"\n[INFO] Guardando base-precios.json...")
        with open('base-precios.json', 'w', encoding='utf-8') as f:
            json.dump(partidas, f, ensure_ascii=False, separators=(',', ':'))

        print("[OK] ✓ base-precios.json actualizado")
        print("\nPróximos pasos:")
        print("  1. python inyectar-precios-gestor.py")
        print("  2. git add base-precios.json gestor-presupuestos.html")
        print("  3. git commit && git push")
    else:
        print("\n[INFO] No se encontraron descripciones nuevas para actualizar")

if __name__ == '__main__':
    main()
