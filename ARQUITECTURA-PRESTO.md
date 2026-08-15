# ARQUITECTURA DEL SISTEMA DE PRESUPUESTOS PROFESIONAL
## Emulación de Presto para Gestión de Presupuestos de Construcción

**Proyecto:** ObraTudela - Sistema Profesional de Presupuestos
**Base de Datos:** BCEXTREM 2026 (53.403 partidas)
**Formato:** FIEBDC-3 (BC3) Compatible
**Empresa:** Excavaciones y Servicios Arturo S.L.

---

## 1. ESTRUCTURA DE DATOS Y BASES DE PRECIOS

### 1.1. Jerarquía de Conceptos

El sistema utiliza una estructura jerárquica de 4 niveles siguiendo el estándar FIEBDC-3:

```
OBRA (Nivel 0)
├── CAPÍTULO 1 (Nivel 1)
│   ├── PARTIDA 1.1 (Nivel 2)
│   │   ├── Mano de Obra
│   │   ├── Maquinaria
│   │   └── Materiales
│   └── PARTIDA 1.2
└── CAPÍTULO 2
    └── PARTIDA 2.1
        └── DESCOMPUESTO
            ├── MO: Oficial 1ª
            ├── MAQ: Retroexcavadora
            └── MAT: Hormigón HL-150
```

### 1.2. Estructura de Datos por Tipo de Concepto

#### A) CAPÍTULOS
```javascript
{
  tipo: 'CAPITULO',
  codigo: '01',
  descripcion: 'DEMOLICIONES',
  nivel: 1,
  partidas: [...],
  totalPEM: 15420.50,
  porcentaje: 12.5
}
```

#### B) PARTIDAS
```javascript
{
  tipo: 'PARTIDA',
  codigo: 'E01EIS065',
  descripcionCorta: 'DEMOLICIÓN COMPLETA ARQUETAS DE PVC',
  descripcionLarga: 'Demolición completa de arquetas de pvc o polipropileno, por medios manuales, incluso limpieza y retirada de escombros a pie de carga...',
  unidad: 'ud',
  precioUnitario: 24.50,
  cantidad: 0,
  mediciones: [],
  descompuesto: {
    manoObra: [...],
    maquinaria: [...],
    materiales: [...]
  }
}
```

#### C) DESCOMPUESTO (Recursos)
```javascript
{
  codigo: 'A02AA005',
  tipo: 'MANO_OBRA', // o 'MAQUINARIA' o 'MATERIAL'
  descripcion: 'Oficial 1ª construcción',
  unidad: 'h',
  precioUnitario: 18.50,
  rendimiento: 0.5, // horas por unidad de partida
  importe: 9.25 // precioUnitario × rendimiento
}
```

### 1.3. Formato FIEBDC-3 (BC3)

El sistema soporta importación/exportación en formato BC3:

```
~V|FIEBDC-3/2024|BCEXTREM|BCEXTREM 2026|53403|
~C|E01EIS065|ud|DEMOLICIÓN COMPLETA ARQUETAS DE PVC O POLIPROPILENO\|
~T|E01EIS065|Demolición completa de arquetas de pvc o polipropileno, por medios manuales, incluso limpieza y retirada de escombros a pie de carga, sin transporte al vertedero, y con p.p. de medios auxiliares.|
~D|E01EIS065|A02AA010\0.500\|G01C030\0.015\|
~K|% \2\CI\0\
```

**Tipos de registros BC3:**
- `~V`: Versión y metadatos
- `~C`: Concepto (código, unidad, descripción)
- `~D`: Descomposición (código padre, hijos con rendimientos)
- `~T`: Texto largo
- `~M`: Medición
- `~K`: Configuración

---

## 2. MÓDULO DE MEDICIONES Y PRESUPUESTOS

### 2.1. Sistema de Mediciones con Fórmulas

Cada partida puede tener múltiples líneas de medición:

```javascript
{
  partidaCodigo: 'E01EIS065',
  lineas: [
    {
      numero: 1,
      comentario: 'Arquetas zona norte',
      tipo: 'FORMULA', // o 'CANTIDAD_DIRECTA'
      largo: 3,
      ancho: 0,
      alto: 0,
      unidades: 1,
      subtotal: 3.00, // largo × ancho × alto × unidades
      formula: 'N * L * A * H'
    },
    {
      numero: 2,
      comentario: 'Arquetas zona sur',
      tipo: 'CANTIDAD_DIRECTA',
      cantidad: 2.00
    }
  ],
  totalMedicion: 5.00
}
```

### 2.2. Tipos de Fórmulas de Medición

#### Fórmula Básica (Dimensiones)
```
N × L × A × H
Unidades × Largo × Ancho × Alto
```

**Ejemplo:**
```
3 arquetas de 2m × 1m × 0.8m
N=3, L=2, A=1, H=0.8
Total = 3 × 2 × 1 × 0.8 = 4.8 m³
```

#### Fórmulas Avanzadas
```javascript
{
  tipo: 'PERIMETRO',
  formula: '2 × (L + A)',
  ejemplo: '2 × (10 + 8) = 36 ml'
},
{
  tipo: 'AREA_CIRCULAR',
  formula: 'π × R²',
  ejemplo: '3.14159 × 4² = 50.27 m²'
},
{
  tipo: 'VOLUMEN_CILINDRO',
  formula: 'π × R² × H',
  ejemplo: '3.14159 × 2² × 3 = 37.70 m³'
}
```

### 2.3. Cálculo del Presupuesto

```javascript
// NIVEL 1: Precio de Partida
precioPartida = Σ (precioRecurso × rendimiento)

// NIVEL 2: PEM (Presupuesto Ejecución Material)
PEM = Σ (precioPartida × cantidadMedida)

// NIVEL 3: Presupuesto de Contrata
gastosGenerales = PEM × 0.13  // 13%
beneficioIndustrial = PEM × 0.06  // 6%
presupuestoContrata = PEM + gastosGenerales + beneficioIndustrial
// Equivalente: PEM × 1.19

// NIVEL 4: Presupuesto con IVA
IVA = presupuestoContrata × 0.21  // 21%
presupuestoTotal = presupuestoContrata + IVA
// Equivalente: PEM × 1.19 × 1.21 = PEM × 1.4399
```

**Ejemplo Completo:**
```
Partida: E01EIS065 - Demolición arquetas PVC
Precio unitario: 24.50 €/ud
Medición: 5 ud

Cálculo:
PEM = 24.50 × 5 = 122.50 €
Gastos Generales (13%) = 122.50 × 0.13 = 15.93 €
Beneficio Industrial (6%) = 122.50 × 0.06 = 7.35 €
Presupuesto Contrata = 122.50 + 15.93 + 7.35 = 145.78 €
IVA (21%) = 145.78 × 0.21 = 30.61 €
TOTAL = 145.78 + 30.61 = 176.39 €
```

---

## 3. CONTROL DE COSTES Y GESTIÓN DE OFERTAS

### 3.1. Comparativo de Ofertas

Estructura para comparar ofertas de proveedores:

```javascript
{
  partidaCodigo: 'E01EIS065',
  descripcion: 'Demolición arquetas PVC',
  cantidad: 5,
  unidad: 'ud',
  ofertas: [
    {
      proveedor: 'Proveedor A S.L.',
      nif: 'B12345678',
      precioUnitario: 24.50,
      total: 122.50,
      plazo: '5 días',
      observaciones: 'Incluye transporte',
      seleccionada: true
    },
    {
      proveedor: 'Proveedor B S.L.',
      nif: 'B87654321',
      precioUnitario: 26.00,
      total: 130.00,
      plazo: '3 días',
      observaciones: 'Urgente',
      seleccionada: false
    }
  ],
  ofertaElegida: 0, // índice
  ahorro: 7.50 // diferencia con la más cara
}
```

### 3.2. Control de Certificaciones

Sistema de certificaciones mensuales para control de obra:

```javascript
{
  numeroCertificacion: 1,
  fecha: '2026-01-31',
  periodo: 'Enero 2026',
  partidas: [
    {
      codigo: 'E01EIS065',
      descripcion: 'Demolición arquetas',
      cantidadProyecto: 10,
      unidad: 'ud',
      precioUnitario: 24.50,

      // Certificación actual
      cantidadEjecutada: 3,
      importeEjecutado: 73.50,

      // Acumulado hasta la fecha
      cantidadAcumulada: 3,
      importeAcumulado: 73.50,

      // Pendiente
      cantidadPendiente: 7,
      importePendiente: 171.50,
      porcentajeEjecutado: 30.0
    }
  ],

  // Totales de la certificación
  importeEjecutadoPEM: 73.50,
  importeAcumuladoPEM: 73.50,
  gastos Generales: 9.56,
  beneficioIndustrial: 4.41,
  subtotalContrata: 87.47,
  iva: 18.37,
  totalCertificacion: 105.84,

  // Control de avance
  porcentajeObraEjecutado: 5.2,
  desviacionPresupuesto: 0.0, // %
  estado: 'APROBADA' // BORRADOR, PENDIENTE, APROBADA, PAGADA
}
```

### 3.3. Análisis de Desviaciones

```javascript
{
  partidaCodigo: 'E01EIS065',
  presupuestoPrevisto: 245.00, // 10 ud × 24.50
  costeReal: 260.00, // 10 ud × 26.00 (oferta real)
  desviacion: 15.00,
  desviacionPorcentual: 6.12,
  causa: 'Incremento precio proveedor',
  accion: 'Renegociar para próximas certificaciones'
}
```

---

## 4. SALIDAS E INFORMES

### 4.1. Presupuesto Impreso

Estructura del documento impreso:

```
═══════════════════════════════════════════════════════════
          PRESUPUESTO DE EJECUCIÓN MATERIAL
═══════════════════════════════════════════════════════════

Proyecto: Reforma Integral Vivienda
Cliente: Juan García Pérez
Fecha: 15/08/2026
NIF Empresa: B47489612

───────────────────────────────────────────────────────────
CAPÍTULO 01: DEMOLICIONES Y DERRIBOS
───────────────────────────────────────────────────────────

01.01  E01EIS065  ud  Demolición completa arquetas PVC

       Demolición completa de arquetas de pvc o
       polipropileno, por medios manuales, incluso limpieza
       y retirada de escombros a pie de carga, sin
       transporte al vertedero, y con p.p. de medios
       auxiliares.

       Medición: 5.00 ud × 24.50 €/ud ............  122.50 €

───────────────────────────────────────────────────────────
TOTAL CAPÍTULO 01 ...............................  122.50 €
───────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════
RESUMEN DEL PRESUPUESTO
═══════════════════════════════════════════════────════════

Presupuesto de Ejecución Material (PEM) .......  122.50 €
Gastos Generales (13%) ........................   15.93 €
Beneficio Industrial (6%) .....................    7.35 €
                                                 ─────────
TOTAL PRESUPUESTO DE CONTRATA .................  145.78 €
IVA (21%) .....................................   30.61 €
                                                 ═════════
TOTAL PRESUPUESTO CON IVA .....................  176.39 €
                                                 ═════════

Asciende el presente presupuesto a la cantidad de:
CIENTO SETENTA Y SEIS EUROS CON TREINTA Y NUEVE CÉNTIMOS

───────────────────────────────────────────────────────────
Excavaciones y Servicios Arturo S.L.
Calle Manzano, 2 - 47320 Tudela de Duero (Valladolid)
Tel: 607 444 903 | Email: excavacionesart@gmail.com
═══════════════════════════════════════════════════════════
```

### 4.2. Cuadro de Precios Nº 1 (Sin Descomponer)

```
═══════════════════════════════════════════════════════════
               CUADRO DE PRECIOS Nº 1
             (Precios sin descomponer)
═══════════════════════════════════════════════════════════

CAPÍTULO 01: DEMOLICIONES Y DERRIBOS

01.01  E01EIS065  ud  Demolición completa arquetas PVC

       Precio: VEINTICUATRO EUROS CON CINCUENTA CÉNTIMOS
                                            (24.50 €/ud)

───────────────────────────────────────────────────────────
```

### 4.3. Cuadro de Precios Nº 2 (Descompuesto)

```
═══════════════════════════════════════════════════════════
               CUADRO DE PRECIOS Nº 2
              (Precios descompuestos)
═══════════════════════════════════════════════════════════

CAPÍTULO 01: DEMOLICIONES Y DERRIBOS

01.01  E01EIS065  Demolición completa arquetas PVC  (ud)

  MANO DE OBRA:
  A02AA010   0.500 h  Oficial 1ª construcción
                                        18.50 €/h    9.25 €
  A02AA020   0.250 h  Peón ordinario construcción
                                        16.20 €/h    4.05 €

  MAQUINARIA:
  G01C030    0.015 h  Carga manual sobre camión
                                         2.65 €/h    0.04 €

  MATERIALES:
  (sin materiales en esta partida)
                                                   ────────
  Coste Directo .....................................  13.34 €
  Medios auxiliares (2%) ............................   0.27 €
  Costes indirectos (6%) ............................   0.82 €
                                                   ────────
  Precio Unitario sin IVA ...........................  14.43 €
  IVA (21%) .........................................   3.03 €
                                                   ════════
  TOTAL .............................................  17.46 €

───────────────────────────────────────────────────────────
```

### 4.4. Formatos de Exportación

#### A) Exportación a Excel (.xlsx)

```javascript
// Estructura de hojas
{
  hojas: [
    {
      nombre: 'Resumen',
      columnas: ['Capítulo', 'Descripción', 'Importe', '% Total'],
      datos: [[...], [...]]
    },
    {
      nombre: 'Mediciones',
      columnas: ['Código', 'Partida', 'Línea', 'N', 'L', 'A', 'H', 'Total'],
      datos: [[...], [...]]
    },
    {
      nombre: 'Precios Descompuestos',
      columnas: ['Código', 'Tipo', 'Descripción', 'Unidad', 'Precio'],
      datos: [[...], [...]]
    }
  ]
}
```

#### B) Exportación a PDF

```javascript
{
  documentoConfig: {
    formato: 'A4',
    orientacion: 'vertical',
    margenes: { top: 20, right: 15, bottom: 20, left: 15 },
    fuente: 'Arial',
    tamaño: 10
  },

  secciones: [
    { tipo: 'portada', datos: {...} },
    { tipo: 'indice', paginas: [...] },
    { tipo: 'presupuesto', capitulos: [...] },
    { tipo: 'mediciones', partidas: [...] },
    { tipo: 'cuadro_precios_1', partidas: [...] },
    { tipo: 'cuadro_precios_2', descompuestos: [...] },
    { tipo: 'pliego_condiciones', texto: '...' }
  ]
}
```

#### C) Exportación a BC3 (FIEBDC-3)

```javascript
function exportarBC3(proyecto) {
  let bc3 = '';

  // 1. Cabecera
  bc3 += `~V|FIEBDC-3/2024|OBRATUDELA|${proyecto.nombre}|${proyecto.numeroPartidas}|\r\n`;

  // 2. Información general
  bc3 += `~K|% \2\CI\0\\\r\n`;

  // 3. Conceptos
  for (const partida of proyecto.partidas) {
    bc3 += `~C|${partida.codigo}|${partida.unidad}|${partida.descripcionCorta}\\|\r\n`;

    // Texto largo
    if (partida.descripcionLarga) {
      bc3 += `~T|${partida.codigo}|${partida.descripcionLarga}|\r\n`;
    }

    // Descomposición
    if (partida.descompuesto.length > 0) {
      let decomp = '~D|' + partida.codigo + '|';
      for (const recurso of partida.descompuesto) {
        decomp += `${recurso.codigo}\\${recurso.rendimiento}\\|`;
      }
      bc3 += decomp + '\r\n';
    }

    // Mediciones
    if (partida.mediciones.length > 0) {
      for (const med of partida.mediciones) {
        bc3 += `~M|${partida.codigo}|${med.tipo}|${med.comentario}|${med.largo}|${med.ancho}|${med.alto}|${med.subtotal}|\r\n`;
      }
    }
  }

  return bc3;
}
```

---

## 5. FLUJO DE TRABAJO COMPLETO

### 5.1. Creación de Nuevo Proyecto

```
1. INICIALIZACIÓN
   ├─ Crear proyecto vacío
   ├─ Cargar base de datos BCEXTREM 2026
   └─ Configurar datos generales (nombre, cliente, fecha)

2. ESTRUCTURA DE CAPÍTULOS
   ├─ Definir capítulos principales
   ├─ Organizar por oficios/fases
   └─ Asignar códigos jerárquicos

3. AÑADIR PARTIDAS
   ├─ Buscar en base de datos
   ├─ Seleccionar partidas necesarias
   ├─ Asignar a capítulos
   └─ Verificar descompuestos

4. REALIZAR MEDICIONES
   ├─ Crear líneas de medición por partida
   ├─ Introducir fórmulas (N × L × A × H)
   ├─ Calcular totales automáticos
   └─ Revisar y ajustar

5. GENERAR PRESUPUESTO
   ├─ Calcular PEM automáticamente
   ├─ Aplicar 13% GG + 6% BI
   ├─ Calcular IVA 21%
   └─ Obtener total con IVA
```

### 5.2. Gestión de Ofertas y Contratación

```
1. SOLICITAR OFERTAS
   ├─ Exportar partidas seleccionadas
   ├─ Enviar a proveedores/subcontratistas
   └─ Establecer plazo de respuesta

2. COMPARAR OFERTAS
   ├─ Importar ofertas recibidas
   ├─ Comparar precios unitarios
   ├─ Evaluar plazos y condiciones
   └─ Calcular ahorros potenciales

3. ADJUDICAR
   ├─ Seleccionar mejor oferta
   ├─ Actualizar precios del presupuesto
   ├─ Generar orden de compra
   └─ Archivar ofertas descartadas
```

### 5.3. Control de Obra y Certificaciones

```
1. DURANTE LA EJECUCIÓN
   ├─ Registrar avances semanales
   ├─ Actualizar cantidades ejecutadas
   ├─ Detectar desviaciones
   └─ Tomar acciones correctivas

2. CERTIFICACIÓN MENSUAL
   ├─ Crear nueva certificación
   ├─ Medir cantidades ejecutadas
   ├─ Calcular importe período
   ├─ Acumular totales
   └─ Generar documento PDF

3. SEGUIMIENTO
   ├─ Comparar previsto vs ejecutado
   ├─ Analizar desviaciones económicas
   ├─ Proyectar costes finales
   └─ Informar al cliente

4. CIERRE DE OBRA
   ├─ Certificación final
   ├─ Liquidación de partidas
   ├─ Comparativa final
   └─ Archivo del proyecto
```

---

## 6. INTEGRACIÓN CON BIM (OPCIONAL)

### 6.1. Vinculación con Modelos IFC

```javascript
{
  elementoIFC: {
    guid: '2O2Fr$t4X7Zf8NOew3FLOH',
    tipo: 'IfcWall',
    propiedades: {
      nombre: 'Muro Exterior Norte',
      espesor: 0.30,
      altura: 2.60,
      longitud: 12.50,
      volumen: 9.75 // m³
    }
  },

  partidaVinculada: {
    codigo: 'E04AA010',
    descripcion: 'Fábrica ladrillo perforado',
    unidad: 'm2',
    cantidad: 32.50, // longitud × altura
    origen: 'BIM_AUTO' // calculado desde IFC
  }
}
```

### 6.2. Extracción Automática de Mediciones

```
IFC Element → BCF (Building Cost Format) → Partida Presupuesto

Ejemplo:
IfcWall (GUID: xxx)
  ├─ Cantidad: 32.50 m²
  ├─ Clasificación: NL-SfB 21.1
  └─ Vinculada a: E04AA010 (Fábrica ladrillo)
```

---

## 7. CARACTERÍSTICAS TÉCNICAS DEL SISTEMA

### 7.1. Base de Datos

```
- Formato: JSON comprimido (gzip)
- Tamaño: 18 MB (original) → 16 MB (comprimido)
- Partidas: 53.403 conceptos
- Categorías: 16 capítulos principales
- Búsqueda: Índice invertido en memoria
- Rendimiento: <200ms búsqueda full-text
```

### 7.2. Almacenamiento

```javascript
// LocalStorage para proyectos
{
  'proyectos': [
    { id: 1, nombre: 'Proyecto A', fecha: '2026-01-15' },
    { id: 2, nombre: 'Proyecto B', fecha: '2026-02-20' }
  ],
  'proyecto_1': { /* datos completos */ },
  'configuracion': { /* preferencias usuario */ }
}

// Límite: ~5-10 MB por proyecto
// Compresión automática si excede límite
```

### 7.3. Rendimiento

```
Operaciones en memoria (ms):
- Búsqueda partida: <50 ms
- Cálculo mediciones: <10 ms
- Renderizado tabla: <100 ms
- Exportar PDF: <2000 ms
- Exportar Excel: <500 ms
- Guardar proyecto: <300 ms
```

---

## 8. CASOS DE USO REALES

### Caso 1: Presupuesto de Demolición de Arquetas

```
Cliente solicita: "Necesito demoler 5 arquetas de PVC"

Proceso:
1. Buscar partida: "demolición arquetas PVC"
   → Encontrada: E01EIS065
2. Añadir medición:
   - Línea 1: 3 ud (zona norte)
   - Línea 2: 2 ud (zona sur)
   - Total: 5 ud
3. Cálculo automático:
   - PEM: 5 × 24.50 = 122.50 €
   - Contrata (×1.19): 145.78 €
   - Con IVA (×1.21): 176.39 €
4. Generar presupuesto PDF
5. Enviar al cliente
```

### Caso 2: Reforma Integral Vivienda

```
Proyecto: Reforma 120 m²

Capítulos:
01. Demoliciones .................... 3.450,00 €
02. Albañilería ..................... 8.200,00 €
03. Instalaciones ................... 6.750,00 €
04. Revestimientos .................. 5.900,00 €
05. Carpintería ..................... 4.200,00 €

PEM Total: 28.500,00 €
Contrata: 33.915,00 €
Con IVA: 41.037,15 €

Certificaciones:
- Mes 1: 30% ejecutado (8.550 €)
- Mes 2: 65% ejecutado (18.525 €)
- Mes 3: 100% ejecutado (28.500 €)
```

---

## CONCLUSIÓN

Este sistema emula las funcionalidades profesionales de Presto adaptado a las necesidades de **Excavaciones y Servicios Arturo S.L.** para:

1. ✅ Gestión completa de presupuestos de construcción
2. ✅ Mediciones detalladas con fórmulas geométricas
3. ✅ Control de costes y certificaciones de obra
4. ✅ Exportación a formatos estándar (PDF/Excel/BC3)
5. ✅ Base de datos BCEXTREM 2026 (53.403 partidas)

**Tecnologías utilizadas:**
- Frontend: HTML5 + CSS3 + JavaScript ES6
- Base de datos: JSON (BCEXTREM 2026)
- Exportación: jsPDF, XLSX.js, Pako (compresión)
- Formato: FIEBDC-3 (BC3) compatible

**Beneficios:**
- Sin instalación, funciona en navegador
- Acceso desde cualquier dispositivo
- Base de datos actualizada 2026
- Interfaz profesional y moderna
- Compatible con estándares de construcción españoles

---

**Documentación generada por:** Excavaciones y Servicios Arturo S.L.
**Fecha:** 15/08/2026
**Versión:** 1.0.0
**Contacto:** excavacionesart@gmail.com | 607 444 903
