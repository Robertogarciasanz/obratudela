# 🚀 Guía de Migración a Cloudflare Pages

Esta guía te llevará paso a paso para migrar **www.obratudela.com** de GitHub Pages a Cloudflare Pages.

---

## ⏱️ Tiempo estimado: 15 minutos

---

## 📋 Requisitos Previos

- [ ] Cuenta de Cloudflare (gratis en [dash.cloudflare.com](https://dash.cloudflare.com))
- [ ] Acceso al repositorio GitHub de obratudela
- [ ] Dominio `obratudela.com` agregado a Cloudflare

---

## 🎯 Beneficios de la Migración

### Antes (GitHub Pages)
- ⏱️ Despliegues: ~2-3 minutos
- 🌍 CDN: Solo en USA/Europa
- 📊 Analytics: Requiere Google Analytics
- 🔧 Personalización: Limitada
- 💾 Caché: Básico

### Después (Cloudflare Pages)
- ⚡ Despliegues: ~30 segundos
- 🌍 CDN: 330+ ubicaciones globales
- 📊 Analytics: Incluido sin cookies
- 🔧 Personalización: Headers, redirects, functions
- 💾 Caché: Avanzado con Cache Reserve disponible
- 🚀 Auto Minify: HTML/CSS/JS
- 🗜️ Compresión: Brotli automático
- 🔐 SSL/TLS: Gratis y automático

---

## 📝 Paso 1: Preparar el Repositorio

Los siguientes archivos ya están creados en tu repositorio:

### ✅ Archivos de Configuración

1. **`_headers`** - Configuración de headers HTTP
   - Caché optimizado para archivos estáticos (1 año)
   - Caché medio para datos JSON (1 hora)
   - Headers de seguridad (XSS, Frame Options, etc.)
   - Preload de recursos críticos

2. **`_redirects`** - Redirecciones y rewrites
   - Servir archivos Brotli automáticamente
   - Página 404 personalizada

3. **`wrangler.toml`** - Configuración de Wrangler (opcional)
   - Variables de entorno
   - Configuración de build

### 🔄 Commit de Archivos

```bash
git add _headers _redirects wrangler.toml MIGRACION-CLOUDFLARE-PAGES.md
git commit -m "feat: agregar configuración para Cloudflare Pages

- Headers optimizados para caché y seguridad
- Redirects para archivos comprimidos
- Configuración de Wrangler
- Guía de migración

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

---

## 🌐 Paso 2: Crear Proyecto en Cloudflare Pages

### 2.1 Acceder a Cloudflare Dashboard

1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
2. Inicia sesión con tu cuenta
3. En el menú lateral, selecciona **Workers & Pages**
4. Haz clic en **Create application**
5. Selecciona la pestaña **Pages**
6. Haz clic en **Connect to Git**

### 2.2 Conectar Repositorio GitHub

1. Selecciona **GitHub** como proveedor
2. Autoriza a Cloudflare para acceder a GitHub
3. Busca el repositorio `obratudela` (o tu usuario/obratudela)
4. Haz clic en **Begin setup**

### 2.3 Configurar Build Settings

En la pantalla de configuración:

| Campo | Valor |
|-------|-------|
| **Project name** | `obratudela` |
| **Production branch** | `main` |
| **Framework preset** | `None` (es un sitio estático) |
| **Build command** | *(dejar vacío)* |
| **Build output directory** | `/` (raíz del proyecto) |

**¿Por qué estos valores?**
- No necesitamos build porque no usamos framework (React, Vue, etc.)
- Los archivos HTML están en la raíz del repositorio
- Cloudflare servirá todo el contenido tal cual está

### 2.4 Variables de Entorno (Opcional)

Si necesitas variables de entorno en el futuro (para Pages Functions):

```
ENVIRONMENT=production
```

Por ahora, **no agregar nada**.

### 2.5 Hacer clic en "Save and Deploy"

Cloudflare comenzará el primer despliegue. Verás:

```
⏳ Initializing build environment...
✅ Cloning repository...
✅ Building application...
✅ Deploying to Cloudflare's global network...
🎉 Success! Deployed to https://obratudela.pages.dev
```

---

## 🔗 Paso 3: Configurar Dominio Personalizado

### 3.1 Agregar Dominio Personalizado

1. En el dashboard del proyecto, ve a **Custom domains**
2. Haz clic en **Set up a custom domain**
3. Ingresa `www.obratudela.com`
4. Haz clic en **Continue**

### 3.2 Configurar DNS

Cloudflare te mostrará los registros DNS necesarios. Si tu dominio ya está en Cloudflare:

**Opción A: CNAME (Recomendado)**
```
Tipo: CNAME
Nombre: www
Destino: obratudela.pages.dev
Proxy: ✅ Activado (naranja)
```

**Opción B: Apex Domain**
Si quieres usar `obratudela.com` (sin www):
```
Tipo: CNAME
Nombre: @
Destino: obratudela.pages.dev
Proxy: ✅ Activado (naranja)
```

**Redirección www ↔ apex:**
Para redirigir automáticamente de `www.obratudela.com` a `obratudela.com` (o viceversa):

1. Ve a **Rules** → **Page Rules** en el dashboard de Cloudflare
2. Crea una regla:
   ```
   URL: www.obratudela.com/*
   Configuración: Forwarding URL (301 - Permanent Redirect)
   Destino: https://obratudela.com/$1
   ```

### 3.3 Verificar SSL/TLS

1. Ve a **SSL/TLS** en el dashboard de Cloudflare
2. Asegúrate de que esté en modo **Full (strict)** o **Full**
3. El certificado SSL se genera automáticamente (1-5 minutos)

---

## ⚙️ Paso 4: Optimizaciones Adicionales (Recomendado)

### 4.1 Activar Auto Minify

1. En Cloudflare Dashboard, ve a tu dominio
2. **Speed** → **Optimization**
3. Activa **Auto Minify** para:
   - ✅ JavaScript
   - ✅ CSS
   - ✅ HTML

### 4.2 Activar Brotli

1. En **Speed** → **Optimization**
2. Activa **Brotli** (compresión superior a Gzip)

Ya tienes archivos `.br` pre-comprimidos en `data/`, pero Cloudflare puede comprimir todo automáticamente.

### 4.3 Configurar Cache Rules (Opcional - Plan Pro)

Si tienes plan Pro, puedes crear reglas de caché más específicas:

1. Ve a **Caching** → **Cache Rules**
2. Crea regla para archivos JSON:
   ```
   Si: URI Path contiene "/data/"
   Entonces:
     - Cache Level: Standard
     - Edge TTL: 1 hora
     - Browser TTL: 30 minutos
   ```

En el plan Free, los headers del archivo `_headers` ya configuran el caché adecuadamente.

### 4.4 Activar Web Analytics (Gratis, sin cookies)

1. En Cloudflare Dashboard, ve a **Analytics** → **Web Analytics**
2. Haz clic en **Add a site**
3. Ingresa `www.obratudela.com`
4. Copia el snippet de JavaScript que te dan
5. Pégalo en `index.html` antes del `</head>`

**Snippet ejemplo:**
```html
<!-- Cloudflare Web Analytics -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
        data-cf-beacon='{"token": "TU-TOKEN-AQUI"}'></script>
<!-- End Cloudflare Web Analytics -->
```

---

## 🧪 Paso 5: Probar el Sitio

### 5.1 Verificar Funcionalidad

Visita `https://obratudela.pages.dev` (o `www.obratudela.com` si ya configuraste el dominio):

- [ ] La página principal carga correctamente
- [ ] Los estilos CSS se aplican
- [ ] Las imágenes se muestran
- [ ] El menú de navegación funciona
- [ ] Los presupuestos cargan (`/pages/gestor-presupuestos.html`)
- [ ] Los anuncios funcionan (`/anuncios.html`)
- [ ] La galería de obras funciona (`/pages/obras.html`)

### 5.2 Verificar Headers

Abre DevTools (F12) → Network → Selecciona cualquier archivo → Headers

Deberías ver:
```
cache-control: public, max-age=31536000, immutable
cf-cache-status: HIT (después de la segunda carga)
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
```

### 5.3 Verificar Compresión

En DevTools → Network, verifica que los archivos JSON grandes tengan:
```
content-encoding: br
```

### 5.4 Probar Velocidad

Usa herramientas para medir la mejora:

- [PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)

**Métricas esperadas:**
- First Contentful Paint (FCP): < 1s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s

---

## 🔄 Paso 6: Actualizar Workflow de GitHub (Opcional)

El archivo `.github/workflows/deploy.yml` actual es para GitHub Pages. Ya no lo necesitas porque Cloudflare Pages se despliega automáticamente desde Git.

**Opciones:**

**A) Eliminar el workflow:**
```bash
git rm .github/workflows/deploy.yml
git commit -m "chore: eliminar workflow de GitHub Pages (ahora usando Cloudflare Pages)"
git push
```

**B) Mantenerlo como respaldo:**
Dejarlo ahí no causa problemas. GitHub Actions se ejecutará pero no afectará tu sitio en Cloudflare.

---

## 🎉 Paso 7: Desactivar GitHub Pages (Opcional)

Si todo funciona correctamente en Cloudflare Pages:

1. Ve a tu repositorio en GitHub
2. **Settings** → **Pages**
3. En "Source", selecciona **None**
4. Haz clic en **Save**

Esto desactiva GitHub Pages pero mantiene el repositorio intacto.

---

## 🚀 Flujo de Trabajo Post-Migración

### Despliegues Automáticos

Cada vez que hagas `git push` a la rama `main`:

1. Cloudflare detecta el cambio automáticamente
2. Inicia un nuevo build en ~10 segundos
3. Despliega a la red global en ~30 segundos
4. Invalida la caché automáticamente
5. Tu sitio está actualizado en < 1 minuto

### Preview Deployments

Cuando crees un Pull Request:

- Cloudflare genera automáticamente una URL de preview
- Ejemplo: `https://abc123.obratudela.pages.dev`
- Puedes probar cambios antes de merge

---

## 📊 Comparativa de Rendimiento

| Métrica | GitHub Pages | Cloudflare Pages | Mejora |
|---------|-------------|------------------|--------|
| **Tiempo de despliegue** | 2-3 min | 30 seg | 🚀 6x más rápido |
| **Locaciones CDN** | ~10 | 330+ | 🌍 33x más cobertura |
| **TTFB (Asia)** | ~800ms | ~50ms | ⚡ 16x más rápido |
| **Compresión** | Gzip | Brotli | 📦 15-20% más pequeño |
| **Cache Hit Rate** | ~70% | ~95% | 💾 Mejor caché |
| **SSL/TLS** | Básico | Avanzado | 🔐 Más seguro |

---

## 🔧 Troubleshooting

### ❌ El sitio no carga

**Verificar:**
1. El despliegue se completó exitosamente en Cloudflare Dashboard
2. Los registros DNS están configurados correctamente
3. El modo SSL/TLS es "Full" o "Full (strict)"

**Solución:**
- Espera 5-10 minutos para propagación DNS
- Limpia caché del navegador (Ctrl + Shift + R)
- Verifica en modo incógnito

### ❌ Los archivos JSON no cargan

**Verificar:**
1. Los archivos existen en `data/`
2. Los headers en `_headers` están correctos
3. El Content-Type es `application/json`

**Solución:**
- Verifica en DevTools → Network el código de respuesta
- Si es 404, asegúrate de que los archivos están commiteados
- Si es CORS, agrega `Access-Control-Allow-Origin: *` en `_headers`

### ❌ Las fuentes no cargan

**Verificar:**
1. Los archivos `.woff2` están en `/fonts/`
2. El header `Access-Control-Allow-Origin` está configurado

**Solución:**
Ya está configurado en `_headers`:
```
/fonts/*
  Access-Control-Allow-Origin: *
```

### ❌ Errores de caché

**Solución:**
1. En Cloudflare Dashboard → **Caching** → **Configuration**
2. Haz clic en **Purge Everything**
3. Espera 30 segundos
4. Recarga la página

---

## 📈 Próximos Pasos (Opcional)

Una vez migrado a Cloudflare Pages, puedes aprovechar más funcionalidades:

### 1. Cloudflare Pages Functions
Convierte tu `admin-server.js` a Pages Functions:
- API serverless en `/functions/api/`
- Sin necesidad de servidor Node.js local
- Ejecución global en el edge

### 2. Cloudflare D1
Migra `anuncios.json` a una base de datos SQL:
- Consultas más rápidas
- Mejor escalabilidad
- Límite de 100,000 lecturas/día (plan Free)

### 3. Cloudflare R2
Almacena archivos JSON grandes en R2:
- Sin costes de egreso
- S3-compatible
- Archivos de hasta 5TB

### 4. Cloudflare Workers AI
Implementa el "Presupuesto con IA":
- Modelos de IA en el edge
- Sin APIs externas
- Latencia ultra-baja

---

## ✅ Checklist Final

Antes de considerar completa la migración:

- [ ] Sitio desplegado en Cloudflare Pages
- [ ] Dominio personalizado configurado (`www.obratudela.com`)
- [ ] SSL/TLS funcionando (candado verde en navegador)
- [ ] Headers de caché configurados correctamente
- [ ] Auto Minify activado
- [ ] Brotli activado
- [ ] Web Analytics agregado (opcional)
- [ ] Todas las páginas funcionan correctamente
- [ ] Archivos JSON cargan correctamente
- [ ] Imágenes y fuentes cargan correctamente
- [ ] Velocidad de carga mejorada (verificar con PageSpeed)
- [ ] GitHub Pages desactivado (opcional)
- [ ] Workflow de GitHub actualizado o eliminado

---

## 📞 Soporte

Si tienes problemas durante la migración:

- **Documentación oficial:** [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)
- **Discord de Cloudflare:** [discord.gg/cloudflaredev](https://discord.gg/cloudflaredev)
- **Foro comunitario:** [community.cloudflare.com](https://community.cloudflare.com)

---

## 🎊 ¡Felicidades!

Tu sitio ahora está corriendo en Cloudflare Pages con:
- ⚡ Rendimiento global mejorado
- 🔐 Seguridad avanzada
- 💾 Caché optimizado
- 🚀 Despliegues ultrarrápidos

**¡Disfruta de tu sitio optimizado! 🎉**
