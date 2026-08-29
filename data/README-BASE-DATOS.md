# Base de Datos de Precios - ObraTudela

## Descripción

Base de datos profesional de precios de construcción extraída del archivo BC3 oficial.

## Especificaciones

- **Total partidas**: 6,527
- **Formato**: JSON + versiones comprimidas (GZ, BR)
- **Códigos**: BC3 estándar (compatibles con Presto, Arquímedes, TCQ, etc.)
- **Origen**: BASE_PRECIOS_UNIFICADA.bc3 (FIEBDC-3/2007)

## Estructura de Archivos

```
base-precios.json        # Base de datos principal (2.1 MB)
base-precios.json.gz     # Comprimido GZ (215 KB)
base-precios.json.br     # Comprimido Brotli (156 KB) ← Usado por la calculadora
```

## Organización por Grupos

| Grupo | Partidas | Descripción |
|---|---|---|
| **Demolición** | 626 | Demoliciones y acondicionamiento del terreno |
| **Estructura** | 254 | Cimentaciones y estructuras |
| **Envolvente** | 459 | Fachadas, aislamientos y cubiertas |
| **Instalaciones** | 349 | Fontanería, electricidad, climatización |
| **Acabados** | 3,290 | Revestimientos, carpintería, pinturas, pavimentos |
| **Urbanización** | 975 | Urbanización, jardinería, mobiliario urbano |
| **Gestión** | 523 | Control de calidad y gestión de residuos |
| **Otros** | 51 | Partidas sin clasificar |

## Estructura de Partida

```json
{
  "cod": "01AAB00001",
  "res": "DEMOLICIÓN DE BÓVEDA A LA CATALANA, INCLUSO CARGA MANUAL",
  "desc": "Descripción completa de la partida",
  "uni": "m2",
  "precio": 15.89,
  "capitulo": "Demoliciones y trabajos previos",
  "grupo": "Demolición"
}
```

## Capítulos (Según Codificación BC3)

| Código | Capítulo | Grupo |
|---|---|---|
| 01 | Demoliciones y trabajos previos | Demolición |
| 02 | Acondicionamiento del terreno | Demolición |
| 03 | Cimentaciones | Estructura |
| 04 | Estructuras | Estructura |
| 05 | Fachadas y particiones | Envolvente |
| 06 | Instalaciones | Instalaciones |
| 07 | Aislamientos e impermeabilizaciones | Envolvente |
| 08 | Revestimientos y trasdosados | Acabados |
| 09 | Cubiertas | Envolvente |
| 10 | Señalización y equipamiento vial | Urbanización |
| 11 | Pavimentos | Acabados |
| 12 | Carpintería | Acabados |
| 13 | Vidrios | Acabados |
| 14 | Pinturas | Acabados |
| 15 | Equipamiento | Acabados |
| 16 | Urbanización exterior | Urbanización |
| 17 | Mobiliario urbano | Urbanización |
| 18 | Jardinería | Urbanización |
| 19 | Control de calidad | Gestión |
| 21 | Gestión de residuos | Gestión |

## Proceso de Generación

1. **Extracción**: `convert-bc3-to-json.py` convierte BC3 → JSON
2. **Organización**: `organizar-bc3-nativo.py` añade capítulos y grupos
3. **Compresión**: Genera versiones .gz y .br

## Compatibilidad

✅ Compatible con software profesional:
- Presto (Presupuestos y control de obra)
- Arquímedes (Cype)
- TCQ (TecnoCAD)
- MED (Obras y proyectos)
- Cualquier software que acepte formato BC3

## Actualización

Para actualizar la base de datos:

```bash
# 1. Colocar nuevo archivo BC3 en /data/
# 2. Ejecutar conversión
python scripts/convert-bc3-to-json.py data/NUEVO_ARCHIVO.bc3 data/base-precios-bc3-nativo.json

# 3. Organizar
python scripts/organizar-bc3-nativo.py

# 4. Reemplazar y comprimir
cp data/base-precios-final.json data/base-precios.json
python -c "import gzip, brotli; data=open('data/base-precios.json','rb').read(); open('data/base-precios.json.gz','wb').write(gzip.compress(data)); open('data/base-precios.json.br','wb').write(brotli.compress(data))"
```

## Notas

- Los códigos BC3 se mantienen intactos para compatibilidad
- Se eliminaron recursos (materiales, mano de obra, maquinaria) que no son necesarios para el usuario final
- La calculadora carga automáticamente la versión comprimida (.br) para mayor velocidad
