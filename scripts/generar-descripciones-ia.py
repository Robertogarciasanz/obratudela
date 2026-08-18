#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generar descripciones largas para partidas sin desc usando Ollama IA
"""

import json
import requests
import time

def generar_descripcion(codigo, unidad, resumen):
    """Genera una descripción larga usando Ollama"""

    prompt = f"""Eres un experto en construcción y presupuestos. Genera una descripción técnica detallada para esta partida de obra:

Código: {codigo}
Unidad: {unidad}
Resumen: {resumen}

La descripción debe ser profesional, técnica y seguir este formato (sin títulos, solo el texto):
- Descripción del trabajo a realizar
- Materiales incluidos
- Medios auxiliares
- Condiciones de ejecución
- Criterios de medición

Importante: Solo texto descriptivo, sin usar el código de partida, sin títulos de sección. Máximo 3-4 líneas."""

    try:
        response = requests.post('http://localhost:11434/api/generate', json={
            'model': 'qwen2.5-coder:1.5b',
            'prompt': prompt,
            'stream': False
        }, timeout=60)

        if response.status_code == 200:
            return response.json()['response'].strip()
        else:
            return ''
    except Exception as e:
        print(f"[ERROR] {codigo}: {e}")
        return ''

def main():
    print("[INFO] Cargando base-precios.json...")
    with open('base-precios.json', 'r', encoding='utf-8') as f:
        partidas = json.load(f)

    # Filtrar partidas sin descripción
    sin_desc = [p for p in partidas if not p.get('desc') or len(p.get('desc', '')) < 10]

    print(f"[INFO] Total partidas: {len(partidas):,}")
    print(f"[INFO] Sin descripción larga: {len(sin_desc):,}")
    print(f"\n¿Generar descripciones con IA para {len(sin_desc):,} partidas?")
    print(f"Nota: Esto puede tardar ~{len(sin_desc) * 5 // 60} minutos")
    print("\n[ADVERTENCIA] Esto consumirá muchos recursos. Solo se recomienda para un subconjunto.")
    print("Presiona Ctrl+C para cancelar o Enter para continuar...")

    try:
        input()
    except KeyboardInterrupt:
        print("\n[INFO] Cancelado por el usuario")
        return

    print("\n[INFO] Generando descripciones (esto tardará un rato)...")
    print("[INFO] Solo se generarán para las primeras 100 partidas como prueba\n")

    actualizadas = 0
    limite = min(100, len(sin_desc))  # Límite de prueba

    for i, p in enumerate(sin_desc[:limite], 1):
        print(f"[{i}/{limite}] {p['cod']} - {p['res'][:50]}...")

        desc = generar_descripcion(p['cod'], p['uni'], p['res'])

        if desc:
            # Actualizar en la lista original
            for partida in partidas:
                if partida['cod'] == p['cod']:
                    partida['desc'] = desc
                    actualizadas += 1
                    break

        # Pausa para no saturar
        time.sleep(0.5)

    if actualizadas > 0:
        print(f"\n[OK] Se generaron {actualizadas} descripciones")
        print("[INFO] Guardando base-precios.json...")

        with open('base-precios.json', 'w', encoding='utf-8') as f:
            json.dump(partidas, f, ensure_ascii=False, separators=(',', ':'))

        print("[OK] Guardado. Ahora ejecuta: python inyectar-precios-gestor.py")
    else:
        print("[INFO] No se generaron descripciones")

if __name__ == '__main__':
    main()
