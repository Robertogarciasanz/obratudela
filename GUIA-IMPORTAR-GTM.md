# Guía de Configuración de Google Tag Manager - ObraTudela

Esta guía te ayudará a configurar Google Tag Manager paso a paso para trackear eventos personalizados en la calculadora de presupuestos.

## ⚠️ Nota Importante

**RECOMENDACIÓN:** Sigue la configuración manual paso a paso. Es más confiable que importar el archivo JSON.

El archivo `GTM-Container-Export.json` se proporciona como referencia técnica, pero puede tener problemas de compatibilidad.

---

## 🚀 Configuración Manual Paso a Paso

### PASO 1: Acceder a GTM

1. Ve a https://tagmanager.google.com/
2. Selecciona tu cuenta
3. Selecciona el contenedor **GTM-T26SL49M**
4. (Opcional) Crea un nuevo espacio de trabajo: "Configuración ObraTudela"

### PASO 2: Crear Variables de Capa de Datos

Ve a **Variables** → **Nueva** → Selecciona **Variable de capa de datos**

Crear estas variables (una por una):

| Nombre Variable | Nombre Capa de Datos | Versión |
|----------------|---------------------|---------|
| DLV - num_partidas | num_partidas | 2 |
| DLV - source | source | 2 |
| DLV - load_time_ms | load_time_ms | 2 |
| DLV - search_term | search_term | 2 |
| DLV - num_results | num_results | 2 |
| DLV - codigo | codigo | 2 |
| DLV - descripcion | descripcion | 2 |
| DLV - precio | precio | 2 |
| DLV - cantidad | cantidad | 2 |
| DLV - total | total | 2 |
| DLV - subtotal | subtotal | 2 |

**Configuración de cada variable:**
1. Haz clic en **"Nueva"** en Variables
2. Haz clic en **"Configuración de la variable"**
3. Selecciona **"Variable de capa de datos"**
4. **Nombre de la variable de capa de datos:** (poner el nombre según la tabla)
5. **Versión de la capa de datos:** 2
6. **Nombre:** (poner el nombre DLV según la tabla)
7. Guardar

### PASO 3: Crear Activadores de Eventos Personalizados

Ve a **Activadores** → **Nuevo** → Selecciona **Evento personalizado**

Crear estos activadores:

| Nombre Activador | Nombre del Evento |
|-----------------|------------------|
| CE - precios_loaded | precios_loaded |
| CE - search | search |
| CE - partida_agregada | partida_agregada |
| CE - presupuesto_exportado | presupuesto_exportado |

**Configuración de cada activador:**
1. Haz clic en **"Nuevo"** en Activadores
2. Haz clic en **"Configuración del activador"**
3. Selecciona **"Evento personalizado"**
4. **Nombre del evento:** (poner el nombre según la tabla)
5. **Este activador se activa en:** Todos los eventos personalizados
6. **Nombre:** (poner el nombre CE según la tabla)
7. Guardar

### PASO 4: Crear Etiqueta de Configuración GA4

Ve a **Etiquetas** → **Nueva**

1. Nombre: `GA4 - Config`
2. Tipo de etiqueta: **Google Analytics: Configuración de GA4**
3. **ID de medición:** `G-XXXXXXXXXX` ← **Reemplaza con tu ID real de GA4**
4. Activador: **All Pages** (viene por defecto)
5. Guardar

### PASO 5: Crear Etiquetas de Eventos GA4

#### 5.1. Evento: Precios Cargados

1. Nombre: `GA4 - Evento Precios Cargados`
2. Tipo: **Google Analytics: Evento de GA4**
3. **Etiqueta de configuración:** {{GA4 - Config}} (seleccionar de la lista)
4. **Nombre del evento:** `precios_loaded`
5. **Parámetros del evento:** Haz clic en "Añadir fila" 3 veces

| Nombre del parámetro | Valor |
|---------------------|-------|
| num_partidas | {{DLV - num_partidas}} |
| source | {{DLV - source}} |
| load_time_ms | {{DLV - load_time_ms}} |

6. **Activador:** CE - precios_loaded
7. Guardar

#### 5.2. Evento: Búsqueda

1. Nombre: `GA4 - Evento Búsqueda`
2. Tipo: **Google Analytics: Evento de GA4**
3. **Etiqueta de configuración:** {{GA4 - Config}}
4. **Nombre del evento:** `search`
5. **Parámetros del evento:**

| Nombre del parámetro | Valor |
|---------------------|-------|
| search_term | {{DLV - search_term}} |
| num_results | {{DLV - num_results}} |

6. **Activador:** CE - search
7. Guardar

#### 5.3. Evento: Partida Agregada

1. Nombre: `GA4 - Evento Partida Agregada`
2. Tipo: **Google Analytics: Evento de GA4**
3. **Etiqueta de configuración:** {{GA4 - Config}}
4. **Nombre del evento:** `add_to_cart`
5. **Parámetros del evento:**

| Nombre del parámetro | Valor |
|---------------------|-------|
| item_id | {{DLV - codigo}} |
| item_name | {{DLV - descripcion}} |
| price | {{DLV - precio}} |
| quantity | {{DLV - cantidad}} |
| value | {{DLV - total}} |

6. **Activador:** CE - partida_agregada
7. Guardar

#### 5.4. CONVERSIÓN: Presupuesto Exportado

1. Nombre: `GA4 - Conversión: Presupuesto Exportado`
2. Tipo: **Google Analytics: Evento de GA4**
3. **Etiqueta de configuración:** {{GA4 - Config}}
4. **Nombre del evento:** `generate_lead` ← **Importante: Este es un evento de conversión**
5. **Parámetros del evento:**

| Nombre del parámetro | Valor |
|---------------------|-------|
| value | {{DLV - total}} |
| currency | EUR |
| num_items | {{DLV - num_partidas}} |
| subtotal | {{DLV - subtotal}} |

6. **Activador:** CE - presupuesto_exportado
7. Guardar

### PASO 6: Vista Previa y Pruebas

1. Haz clic en **"Vista previa"** (esquina superior derecha)
2. Ingresa la URL: `https://www.obratudela.com/calculadora-ia.html`
3. Se abrirá una nueva ventana con GTM Preview Mode
4. Realiza estas acciones en la calculadora:
   - ✅ Espera que cargue → Debe disparar `precios_loaded`
   - ✅ Busca "excavación" → Debe disparar `search`
   - ✅ Agrega una partida → Debe disparar `partida_agregada`
   - ✅ Exporta presupuesto → Debe disparar `presupuesto_exportado`

5. En GTM Preview, verifica que:
   - Los eventos aparezcan en el panel de la izquierda
   - Las variables tengan valores correctos
   - Las etiquetas se disparen (Tags Fired)

### PASO 7: Publicar Contenedor

Si todo funciona correctamente:

1. Haz clic en **"Enviar"** (esquina superior derecha)
2. **Nombre de versión:** "Configuración inicial ObraTudela - Eventos personalizados"
3. **Descripción:** "4 eventos GA4: precios_loaded, search, partida_agregada, presupuesto_exportado"
4. Haz clic en **"Publicar"**

### PASO 8: Marcar Conversión en GA4

1. Ve a tu propiedad de Google Analytics 4
2. Haz clic en **"Configurar"** → **"Eventos"** (menú lateral)
3. Espera 24-48 horas a que aparezca `generate_lead` en la lista
4. Cuando aparezca, activa el interruptor **"Marcar como conversión"**

---

## 📊 Resumen de Configuración

### Variables Creadas (11)
- ✅ DLV - num_partidas
- ✅ DLV - source
- ✅ DLV - load_time_ms
- ✅ DLV - search_term
- ✅ DLV - num_results
- ✅ DLV - codigo
- ✅ DLV - descripcion
- ✅ DLV - precio
- ✅ DLV - cantidad
- ✅ DLV - total
- ✅ DLV - subtotal

### Activadores Creados (4)
- ✅ CE - precios_loaded
- ✅ CE - search
- ✅ CE - partida_agregada
- ✅ CE - presupuesto_exportado

### Etiquetas Creadas (5)
- ✅ GA4 - Config (activador: All Pages)
- ✅ GA4 - Evento Precios Cargados
- ✅ GA4 - Evento Búsqueda
- ✅ GA4 - Evento Partida Agregada
- ✅ **GA4 - Conversión: Presupuesto Exportado** ← CONVERSIÓN PRINCIPAL

---

## 🎯 Eventos Adicionales (Opcional)

Si quieres trackear más eventos, puedes agregar estos siguiendo el mismo patrón:

| Evento | Descripción |
|--------|-------------|
| `partidas_agregadas_bulk` | Múltiples partidas agregadas simultáneamente |
| `partida_eliminada` | Usuario elimina una partida |
| `cantidad_actualizada` | Usuario modifica la cantidad |
| `partida_manual_agregada` | Partida agregada por código manual |
| `partidas_seleccionadas` | Usuario selecciona/deselecciona antes de confirmar |

Ver [GTM-CONFIGURACION.md](GTM-CONFIGURACION.md) para detalles de estos eventos.

---

## 🆘 Solución de Problemas

### Los eventos no se disparan en Preview Mode

1. **Verifica la consola del navegador** (F12)
   - Deberías ver mensajes `📊 Analytics: [nombre_evento]`
   - Si no aparecen, hay un problema en el código JavaScript

2. **Verifica que pako.js esté cargado**
   - En consola: `typeof pako` → debe mostrar "object"
   - Si no, la base de precios no se carga

3. **Limpia caché y recarga**
   - Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)

### Las variables están vacías en GTM Preview

1. **Verifica los nombres** - Deben coincidir exactamente
2. **Verifica la versión** - Debe ser 2
3. **Inspecciona dataLayer:**
   ```javascript
   // En consola del navegador:
   window.dataLayer
   ```
   Deberías ver los eventos con sus parámetros

### Los eventos no llegan a GA4

1. **Verifica el ID de medición**
   - Debe ser `G-XXXXXXX` (tu ID real)
   - Revisa en GA4 → Admin → Flujos de datos

2. **Espera 24-48 horas**
   - Los datos históricos tardan en procesarse
   - "Tiempo real" muestra datos inmediatamente

3. **Verifica que GTM esté publicado**
   - No basta con Vista previa
   - Debes hacer clic en "Enviar" y "Publicar"

### El evento generate_lead no aparece como conversión

1. **Espera 24-48 horas** después de la primera vez que se dispara
2. **Debe haber al menos 1 evento disparado** para que aparezca
3. **Verifica en GA4 → Informes → Tiempo real** que esté llegando

---

## 📚 Recursos Adicionales

- [Documentación oficial de GTM](https://support.google.com/tagmanager)
- [Guía de eventos GA4](https://support.google.com/analytics/answer/9267735)
- [GTM-CONFIGURACION.md](GTM-CONFIGURACION.md) - Documentación detallada de todos los eventos
- [js/README.md](js/README.md) - Documentación de módulos JavaScript
- [js/analytics.js](js/analytics.js) - Código fuente del tracking

---

## ✅ Checklist Final

Antes de finalizar, verifica que:

- [ ] Todas las 11 variables están creadas
- [ ] Los 4 activadores de eventos personalizados están creados
- [ ] La etiqueta GA4 - Config tiene tu ID real de medición
- [ ] Las 4 etiquetas de eventos están creadas y configuradas
- [ ] Vista previa funciona correctamente
- [ ] Los eventos se disparan al realizar acciones
- [ ] Las variables tienen valores correctos
- [ ] El contenedor está publicado
- [ ] `generate_lead` está marcado como conversión en GA4 (después de 24-48h)

---

**¡Listo!** Tu calculadora de presupuestos ahora tiene tracking completo con Google Tag Manager. 🎉

Puedes monitorear el comportamiento de los usuarios, optimizar la experiencia y medir conversiones en Google Analytics 4.
