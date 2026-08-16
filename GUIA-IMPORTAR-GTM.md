# Guía de Importación del Contenedor GTM

Esta guía te ayudará a importar la configuración completa de Google Tag Manager para ObraTudela.

## 📋 Antes de Importar

**IMPORTANTE:** El archivo `GTM-Container-Export.json` es una plantilla. Necesitas reemplazar:
- `G-XXXXXXXXXX` con tu ID de medición de GA4
- Los valores `XXXXXX` se autocompletarán al importar

## 🚀 Pasos para Importar

### 1. Acceder a Google Tag Manager
1. Ve a https://tagmanager.google.com/
2. Selecciona tu cuenta
3. Selecciona el contenedor **GTM-T26SL49M**

### 2. Importar el Contenedor
1. En el menú lateral, haz clic en **"Admin"**
2. En la columna de "Contenedor", haz clic en **"Importar contenedor"**
3. Haz clic en **"Elegir archivo de contenedor"**
4. Selecciona el archivo `GTM-Container-Export.json`
5. Selecciona un espacio de trabajo (recomendado: crear uno nuevo llamado "Import ObraTudela")
6. Opciones de importación:
   - Selecciona **"Sobrescribir"** si es un contenedor nuevo
   - O **"Combinar"** si ya tienes configuraciones existentes
7. Haz clic en **"Confirmar"**

### 3. Configurar tu ID de GA4

Después de importar, necesitas actualizar las etiquetas con tu ID de GA4:

1. Ve a **"Etiquetas"** en el menú lateral
2. Abre la etiqueta **"GA4 - Config"**
3. Reemplaza `G-XXXXXXXXXX` con tu ID de medición real (ej: `G-ABC123DEF4`)
4. Guarda los cambios
5. Repite para todas las etiquetas GA4:
   - GA4 - Evento Precios Cargados
   - GA4 - Evento Búsqueda
   - GA4 - Evento Partida Agregada
   - GA4 - Conversión: Presupuesto Exportado

### 4. Vista Previa y Publicación

1. Haz clic en **"Vista previa"** en la esquina superior derecha
2. Ingresa la URL: `https://www.obratudela.com/calculadora-ia.html`
3. Verifica que los eventos se disparen correctamente:
   - Carga de página
   - `precios_loaded` al cargar la base de datos
   - `search` al buscar partidas
   - `partida_agregada` al agregar una partida
   - `presupuesto_exportado` al exportar

4. Si todo funciona correctamente:
   - Haz clic en **"Enviar"** en la esquina superior derecha
   - Añade un nombre de versión: "Configuración inicial ObraTudela"
   - Añade descripción (opcional)
   - Haz clic en **"Publicar"**

## 📊 Configuración Incluida

### Tags (Etiquetas)
- ✅ **GA4 - Config** - Configuración base de GA4
- ✅ **GA4 - Evento Precios Cargados** - Track carga de BD
- ✅ **GA4 - Evento Búsqueda** - Track búsquedas de usuarios
- ✅ **GA4 - Evento Partida Agregada** - Track partidas agregadas (add_to_cart)
- ✅ **GA4 - Conversión: Presupuesto Exportado** - Track conversión principal (generate_lead)

### Triggers (Activadores)
- ✅ **All Pages** - Todas las páginas
- ✅ **CE - precios_loaded** - Evento personalizado
- ✅ **CE - search** - Evento personalizado
- ✅ **CE - partida_agregada** - Evento personalizado
- ✅ **CE - presupuesto_exportado** - Evento personalizado

### Variables (Variables)
- ✅ **DLV - num_partidas** - Número de partidas
- ✅ **DLV - source** - Fuente de carga (cache/network/fallback)
- ✅ **DLV - load_time_ms** - Tiempo de carga
- ✅ **DLV - search_term** - Término de búsqueda
- ✅ **DLV - num_results** - Número de resultados
- ✅ **DLV - codigo** - Código de partida
- ✅ **DLV - descripcion** - Descripción de partida
- ✅ **DLV - precio** - Precio unitario
- ✅ **DLV - cantidad** - Cantidad
- ✅ **DLV - total** - Total
- ✅ **DLV - subtotal** - Subtotal

## ⚙️ Configuración Manual Alternativa

Si prefieres no importar el contenedor, puedes configurar manualmente siguiendo estos pasos:

### Crear Variables de Capa de Datos

Para cada variable, ve a **Variables** → **Nueva** → **Variable de capa de datos**:

1. Nombre: `DLV - num_partidas`
   - Nombre de la variable de capa de datos: `num_partidas`
   - Versión de la capa de datos: 2

2. Nombre: `DLV - source`
   - Nombre de la variable de capa de datos: `source`
   - Versión de la capa de datos: 2

3. (Repetir para todas las variables listadas arriba)

### Crear Activadores de Eventos Personalizados

Para cada evento, ve a **Activadores** → **Nuevo** → **Evento personalizado**:

1. Nombre: `CE - precios_loaded`
   - Tipo de activador: Evento personalizado
   - Nombre del evento: `precios_loaded`
   - Este activador se activa en: Todos los eventos personalizados

2. (Repetir para: search, partida_agregada, presupuesto_exportado)

### Crear Etiquetas GA4

1. **GA4 - Config**
   - Tipo: Google Analytics: Configuración de GA4
   - ID de medición: `G-XXXXXXXXXX` (tu ID real)
   - Activador: All Pages

2. **GA4 - Evento Precios Cargados**
   - Tipo: Google Analytics: Evento de GA4
   - Nombre del evento: `precios_loaded`
   - Parámetros del evento:
     - num_partidas → {{DLV - num_partidas}}
     - source → {{DLV - source}}
     - load_time_ms → {{DLV - load_time_ms}}
   - Activador: CE - precios_loaded

3. **GA4 - Evento Búsqueda**
   - Tipo: Google Analytics: Evento de GA4
   - Nombre del evento: `search`
   - Parámetros del evento:
     - search_term → {{DLV - search_term}}
     - num_results → {{DLV - num_results}}
   - Activador: CE - search

4. **GA4 - Conversión: Presupuesto Exportado**
   - Tipo: Google Analytics: Evento de GA4
   - Nombre del evento: `generate_lead`
   - Parámetros del evento:
     - value → {{DLV - total}}
     - currency → EUR
     - num_items → {{DLV - num_partidas}}
     - subtotal → {{DLV - subtotal}}
   - Activador: CE - presupuesto_exportado

## 🎯 Verificación Post-Importación

### 1. Modo Vista Previa
- Abre https://www.obratudela.com/calculadora-ia.html
- Abre la consola del navegador (F12)
- Deberías ver mensajes con `📊 Analytics:`
- En GTM Preview, verifica que los eventos aparezcan

### 2. Google Analytics 4
- Ve a tu propiedad de GA4
- Haz clic en **"Tiempo real"**
- Realiza acciones en la calculadora
- Verifica que los eventos aparezcan en tiempo real

### 3. Marcar Conversiones
1. En GA4, ve a **"Configurar"** → **"Eventos"**
2. Busca el evento `generate_lead`
3. Activa el interruptor **"Marcar como conversión"**

## 📈 Eventos Adicionales No Incluidos

Puedes agregar estos eventos siguiendo el mismo patrón:

- `partidas_agregadas_bulk` - Múltiples partidas agregadas
- `partida_eliminada` - Partida eliminada
- `cantidad_actualizada` - Cantidad modificada
- `partida_manual_agregada` - Partida agregada por código
- `partidas_seleccionadas` - Selección de partidas
- `app_error` - Errores de la aplicación

Cada uno sigue el mismo patrón:
1. Crear variables DLV necesarias
2. Crear activador CE
3. Crear etiqueta GA4 con parámetros

## 🆘 Solución de Problemas

### Los eventos no se disparan
- Verifica que la vista previa de GTM esté activa
- Abre la consola del navegador y busca errores
- Verifica que pako.js esté cargado (necesario para descompresión)

### Los eventos no llegan a GA4
- Verifica que el ID de medición sea correcto
- Verifica que la etiqueta de configuración GA4 se dispare en All Pages
- Espera 24-48 horas para ver datos históricos (Tiempo real es inmediato)

### Las variables están vacías
- Verifica que los nombres de las variables coincidan exactamente
- Verifica que la versión de capa de datos sea 2
- Revisa la consola para ver el contenido de `window.dataLayer`

## 📚 Recursos Adicionales

- [Documentación oficial de GTM](https://support.google.com/tagmanager)
- [Guía de eventos GA4](https://support.google.com/analytics/answer/9267735)
- [GTM-CONFIGURACION.md](GTM-CONFIGURACION.md) - Documentación detallada de eventos
- [js/README.md](js/README.md) - Documentación de módulos JavaScript

---

**Nota:** Si tienes dudas o problemas durante la importación, puedes revisar la documentación completa en [GTM-CONFIGURACION.md](GTM-CONFIGURACION.md)
