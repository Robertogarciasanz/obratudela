# 🐍 Scripts Python - ObraTudela

## Uso de los scripts

**IMPORTANTE:** Los scripts ahora están en la carpeta `scripts/`.
Para usarlos, ejecuta desde la raíz del proyecto:

```bash
# Desde la raíz del proyecto (donde está index.html)
python scripts/convert-bc3-to-json.py data/archivo.bc3 data/salida.json
```

## Scripts disponibles

### convert-bc3-to-json.py ⭐
Convierte archivos BC3 (FIEBDC-3) a JSON

**Uso:**
```bash
python scripts/convert-bc3-to-json.py data/BASE_PRECIOS_UNIFICADA.bc3 data/output.json
```

### combinar-bases-precios.py
Combina múltiples archivos JSON de precios eliminando duplicados

**Uso:**
```bash
python scripts/combinar-bases-precios.py data/bcca.json data/cype.json
```

### extraer-desc-pdf-bcca.py
Extrae descripciones del PDF oficial de BCCA y actualiza base-precios.json

**Uso:**
```bash
python scripts/extraer-desc-pdf-bcca.py
```

### generar-desc-bcca.py
Genera descripciones para partidas del BCCA

### generar-descripciones-ia.py
Genera descripciones usando IA

### extraer-textos-bc3.py
Extrae textos de archivos BC3

### inyectar-precios-gestor.py
Inyecta precios en el gestor de presupuestos

## Rutas de archivos

Después de la reorganización:

```
obratudela/
├── scripts/              ← Estás aquí
│   ├── convert-bc3-to-json.py
│   └── ...
├── data/                 ← Los archivos de datos están aquí
│   ├── base-precios.json
│   └── BASE_PRECIOS_UNIFICADA.bc3
└── ...
```

**Al ejecutar scripts, usa rutas relativas:**
- ❌ `base-precios.json`
- ✅ `../data/base-precios.json` (desde scripts/)
- ✅ `data/base-precios.json` (desde raíz)
