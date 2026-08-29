# 📁 Propuesta de Reorganización de Archivos

## 🎯 PROBLEMA ACTUAL:
- 42 archivos en la raíz
- Scripts Python mezclados con HTML
- Archivos de documentación dispersos
- Difícil encontrar cosas

---

## ✅ ESTRUCTURA PROPUESTA:

```
obratudela/
│
├── 📄 index.html                      (RAÍZ - solo lo esencial)
├── 📄 robots.txt
├── 📄 sitemap.xml
├── 📄 CNAME
├── 📄 README.md
│
├── 📂 pages/                          (PÁGINAS HTML)
│   ├── alquileres.html
│   ├── anuncios.html
│   ├── aviso-legal.html
│   ├── base-precios-listado.html
│   ├── calculadora-ia.html
│   ├── calculadora-presupuestos.html
│   ├── gestor-presupuestos.html
│   ├── obras.html
│   └── topografia.html
│
├── 📂 data/                           (DATOS Y BASES DE PRECIOS)
│   ├── base-precios.json              (21 MB - principal)
│   ├── base-precios.json.br           (comprimido Brotli)
│   ├── base-precios.json.gz           (comprimido Gzip)
│   ├── precios-busqueda.json.br
│   ├── precios-busqueda.json.gz
│   ├── BASE_PRECIOS_UNIFICADA.bc3     (BC3 unificado)
│   └── bcca-precios-unitarios.pdf
│
├── 📂 scripts/                        (SCRIPTS PYTHON)
│   ├── convert-bc3-to-json.py         ⭐ (el más usado)
│   ├─-bc3.py
│   ├── generar-desc-bcca.py
│   ├── generar-descripciones-ia.py
│   └── inyectar-precios-gestor.py
│
├── 📂 docs/                           (DOCUMENTACIÓN)
│   ├── AGENTS.md
│   ├── ESTRUCTURA-CAPITULOS.md
│   ├── GTM-CONFIGURACION.md
│   ├── GUIA-IMPORTAR-GTM.md
│   └── PROYECTO-ESTADO.md
│
├── 📂 compressed/                     (ARCHIVOS COMPRIMIDOS HTML)
│   ├── gestor-presupuestos.html.br
│   └── gestor-presupuestos.html.gz
│
├── 📂 css/                            (ya existe)
├── 📂 js/                             (ya existe)
├── 📂 img/                            (ya existe)
├── 📂 fonts/                          (ya existe)
│
└── 📂 utils/                          (UTILIDADES)
    ├── iniciar-servidor.bat
    └── llms.txt
```

---

## 📊 COMPARACIÓN:

| Antes | Después |
|-------|---------|
| 42 archivos en raíz | 6 archivos en raíz |
| Todo mezclado | Organizado por tipo |
| Difícil navegar | Fácil de encontrar |

---

## 🚀 BENEFICIOS:

1. ✅ **Raíz limpia** - Solo 6 archivos principales
2. ✅ **Fácil navegación** - Todo por carpetas lógicas
3. ✅ **Mejor mantenimiento** - Sabes dónde está cada cosa
4. ✅ **Profesional** - Estructura estándar de proyectos web
5. ✅ **Git más limpio** - Commits más organizados

---

## ⚠️ IMPORTANTE - Actualizar rutas:

Después de mover archivos, hay que actualizar:

### En HTML (páginas que mueves a /pages/):
```html
<!-- ANTES -->
<link rel="stylesheet" href="css/styles.css">
<script src="js/app.js"></script>

<!-- DESPUÉS -->
<link rel="stylesheet" href="../css/styles.css">─ combinar-bases-precios.py
│   ├── extraer-desc-pdf-bcca.py
│   ├── extraer-textos
<script src="../js/app.js"></script>
```

### En index.html (enlaces a páginas):
```html
<!-- ANTES -->
<a href="calculadora-presupuestos.html">Calculadora</a>

<!-- DESPUÉS -->
<a href="pages/calculadora-presupuestos.html">Calculadora</a>
```

### En scripts Python (rutas a archivos):
```python
# ANTES
with open('base-precios.json', 'r') as f:

# DESPUÉS
with open('../data/base-precios.json', 'r') as f:
```

---

## 📝 PLAN DE EJECUCIÓN:

### Paso 1: Crear carpetas nuevas
```bash
mkdir -p pages data docs compressed utils
```

### Paso 2: Mover archivos HTML
```bash
mv alquileres.html anuncios.html aviso-legal.html pages/
mv base-precios-listado.html calculadora-*.html pages/
mv gestor-presupuestos.html obras.html topografia.html pages/
```

### Paso 3: Mover datos
```bash
mv base-precios.json* data/
mv precios-busqueda.json* data/
mv BASE_PRECIOS_UNIFICADA.bc3 data/
mv bcca-precios-unitarios.pdf data/
```

### Paso 4: Mover scripts Python
```bash
mv *.py scripts/
```

### Paso 5: Mover documentación
```bash
mv AGENTS.md ESTRUCTURA-CAPITULOS.md docs/
mv GTM-CONFIGURACION.md GUIA-IMPORTAR-GTM.md docs/
mv PROYECTO-ESTADO.md docs/
```

### Paso 6: Mover comprimidos HTML
```bash
mv *.html.br *.html.gz compressed/
```

### Paso 7: Mover utilidades
```bash
mv iniciar-servidor.bat llms.txt utils/
```

### Paso 8: Actualizar rutas en archivos
(Requiere edición manual o script automático)

### Paso 9: Probar localmente
```bash
# Abrir index.html y verificar que todo funciona
```

### Paso 10: Commit y push
```bash
git add .
git commit -m "Reorganizar estructura de archivos"
git push
```

---

## ❓ ¿QUIERES QUE LO HAGA AUTOMÁTICAMENTE?

Puedo ejecutar todo esto automáticamente y actualizar las rutas en los archivos.

**Opciones:**

**A) Hacerlo todo ahora** (15 min)
  - Muevo archivos
  - Actualizo rutas en HTML/Python
  - Pruebo que funciona
  - Hago commit

**B) Solo crear la estructura** (2 min)
  - Creo las carpetas
  - Muevo los archivos
  - TÚ actualizas las rutas manualmente

**C) Dejarlo como está**
  - No cambiar nada

---

**¿Qué prefieres: A, B o C?**
