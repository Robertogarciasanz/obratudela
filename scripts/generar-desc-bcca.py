#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generar descripciones largas para partidas BCCA (códigos numéricos) usando Ollama
"""

import json
import requests
import time
import re

def es_partida_bcca(codigo):
    """Verifica si es una partida BCCA (código numérico)"""
    # BCCA tiene códigos como: 01ALM90003, 02DER10005, etc.
    return bool(re.match(r'^\d{2}[A-Z]{3}\d', codigo))

def generar_descripcion(codigo, unidad, resumen):
    """Genera una descripción larga usando Ollama"""

    prompt = f"""Eres un experto en construcción. Genera una descripción técnica detallada para:

Partida: {resumen}
Unidad: {unidad}

Escribe una descripción profesional de 2-3 líneas que incluya:
- Qué trabajo se realiza
- Materiales o elementos principales incluidos
- Criterio de medición

Escribe solo la descripción, sin encabezados ni el código de partida."""

    try:
        response = requests.post('http://localhost:11434/api/generate', json={
            'model': 'qwen2.5-coder:1.5b',
            'prompt': prompt,
            'stream': False,
            'options': {
                'temperature': 0.7,
                'num_predict': 200
            }
        }, timeout=90)

        if response.status_code == 200:
            texto = response.json()['response'].strip()
            # Limpiar si empieza con el código o texto innecesario
            texto = re.sub(r'^[0-9A-Z]+\s*[:.-]\s*', '', texto)
            texto = re.sub(r'^(Descripción|DESCRIPCIÓN)[:.-]\s*', '', texto)
            return texto
        else:
            return ''
    except Exception as e:
        print(f"  [ERROR] {e}")
        return ''

def main():
    print("[INFO] Cargando base-precios.json...")
    with open('base-precios.json', 'r', encoding='utf-8') as f:
        partidas = json.load(f)

    # Filtrar partidas BCCA sin descripción
    bcca_sin_desc = [p for p in partidas
                     if es_partida_bcca(p['cod'])
                     and (not p.get('desc') or len(p.get('desc', '')) < 10)]

    print(f"[INFO] Total partidas: {len(partidas):,}")
    print(f"[INFO] Partidas BCCA sin descripción: {len(bcca_sin_desc):,}")

    # Preguntar cuántas generar
    # Cantidad por defecto: 500 (o todas si hay menos)
    cantidad = min(500, len(bcca_sin_desc))

    print(f"\n[INFO] Se generarán {cantidad} descripciones automáticamente")
    print(f"  Tiempo estimado: ~{cantidad * 5 // 60} minutos")

    print(f"\n[INFO] Generando {cantidad} descripciones...")
    print(f"[INFO] Tiempo estimado: ~{cantidad * 5 // 60} minutos\n")

    actualizadas = 0
    errores = 0
    inicio = time.time()

    for i, p in enumerate(bcca_sin_desc[:cantidad], 1):
        print(f"[{i}/{cantidad}] {p['cod']} - {p['res'][:60]}...", end=' ')

        desc = generar_descripcion(p['cod'], p['uni'], p['res'])

        if desc and len(desc) > 20:
            # Actualizar en la lista original
            for partida in partidas:
                if partida['cod'] == p['cod']:
                    partida['desc'] = desc
                    actualizadas += 1
                    print("OK")
                    break
        else:
            errores += 1
            print("ERROR")

        # Pausa breve
        time.sleep(0.3)

        # Mostrar progreso cada 10
        if i % 10 == 0:
            transcurrido = time.time() - inicio
            restante = (transcurrido / i) * (cantidad - i)
            print(f"  [{actualizadas} OK, {errores} errores] - Quedan ~{restante/60:.1f} min\n")

    print(f"\n{'='*60}")
    print(f"[OK] Proceso completado")
    print(f"  ✓ Descripciones generadas: {actualizadas}")
    print(f"  ✗ Errores: {errores}")
    print(f"  ⏱ Tiempo total: {(time.time() - inicio)/60:.1f} minutos")
    print(f"{'='*60}\n")

    if actualizadas > 0:
        print("[INFO] Guardando base-precios.json...")
        with open('base-precios.json', 'w', encoding='utf-8') as f:
            json.dump(partidas, f, ensure_ascii=False, separators=(',', ':'))

        print("[OK] ✓ base-precios.json actualizado")
        print("\nPróximos pasos:")
        print("  1. python inyectar-precios-gestor.py")
        print("  2. git add base-precios.json gestor-presupuestos.html")
        print("  3. git commit && git push")
    else:
        print("[INFO] No se guardaron cambios")

if __name__ == '__main__':
    main()
