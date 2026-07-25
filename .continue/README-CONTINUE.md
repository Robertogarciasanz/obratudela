# Guía de Instalación de Continue.dev

Continue.dev es una alternativa **gratuita y de código abierto** a Claude Code que puede usar múltiples modelos de IA.

## Instalación

### 1. Instalar extensión en VSCode

1. Abre VSCode
2. Presiona `Ctrl+Shift+X` (Extensiones)
3. Busca: **"Continue"**
4. Instala: **Continue - Codestral, Claude, and more**
5. Reinicia VSCode

### 2. Configurar el archivo config.yaml

El archivo `config.yaml` ya está creado en `.continue/config.yaml`.

**Ubicación del archivo:**
- Windows: `C:\Users\TU_USUARIO\.continue\config.yaml`
- O en el proyecto: `d:\archivos del pincho\obratudela\.continue\config.yaml`

### 3. Elegir tu modelo de IA

Edita `config.yaml` y elige UNA de estas opciones:

#### Opción A: Ollama (100% GRATIS, funciona sin internet)

**1. Instala Ollama:**
```bash
# Descarga desde: https://ollama.ai
# Windows: Ejecuta el instalador
```

**2. Descarga un modelo:**
```bash
ollama pull deepseek-coder:6.7b
# O un modelo más potente (requiere más RAM):
ollama pull codellama:13b
ollama pull llama3.1:8b
```

**3. En config.yaml, descomenta:**
```yaml
models:
  - name: DeepSeek Coder Local
    provider: ollama
    model: deepseek-coder:6.7b
    apiBase: http://localhost:11434
    roles:
      - chat
      - edit
      - autocomplete
```

**Ventajas:**
- ✅ 100% gratis
- ✅ Funciona sin internet
- ✅ Privacidad total (nada se envía a internet)
- ✅ Sin límites de uso

**Desventajas:**
- ❌ Requiere PC potente (mínimo 8GB RAM, recomendado 16GB)
- ❌ Menos inteligente que GPT-4/Claude

---

#### Opción B: Claude (Anthropic) - Lo más parecido a Claude Code

**1. Consigue API Key:**
- Ve a: https://console.anthropic.com/
- Crea cuenta
- Ve a "API Keys" y crea una nueva
- Cuesta ~$0.015 por 1000 tokens (muy barato para uso personal)

**2. En config.yaml:**
```yaml
models:
  - name: Claude Sonnet 4.5
    provider: anthropic
    model: claude-sonnet-4-5-20250929
    apiKey: sk-ant-api03-TU_API_KEY_AQUI
    roles:
      - chat
      - edit
      - apply
```

**Ventajas:**
- ✅ Igual de inteligente que Claude Code
- ✅ Muy bueno para código
- ✅ Pago por uso (barato)

**Desventajas:**
- 💰 Requiere tarjeta de crédito
- 💰 ~$3-5/mes de uso normal

---

#### Opción C: Gemini (Google) - GRATIS hasta cierto límite

**1. Consigue API Key:**
- Ve a: https://aistudio.google.com/apikey
- Inicia sesión con Google
- Crea API Key (gratis)

**2. En config.yaml:**
```yaml
models:
  - name: Gemini 2.0 Flash
    provider: gemini
    model: gemini-2.0-flash-exp
    apiKey: TU_API_KEY_GEMINI_AQUI
    roles:
      - chat
      - edit
```

**Ventajas:**
- ✅ GRATIS hasta 1500 requests/día
- ✅ Muy rápido
- ✅ Bueno con código

**Desventajas:**
- ⚠️ Límites de uso (pero muy altos)
- ⚠️ No tan bueno como Claude/GPT-4

---

#### Opción D: OpenAI GPT-4

**1. Consigue API Key:**
- Ve a: https://platform.openai.com/api-keys
- Crea cuenta y añade $5-10 de crédito

**2. En config.yaml:**
```yaml
models:
  - name: GPT-4 Turbo
    provider: openai
    model: gpt-4-turbo-preview
    apiKey: sk-TU_API_KEY_OPENAI_AQUI
    roles:
      - chat
      - autocomplete
```

**Ventajas:**
- ✅ Muy inteligente
- ✅ Gran ecosistema

**Desventajas:**
- 💰 Más caro que Claude (~$0.01 por 1000 tokens)

---

## Uso de Continue.dev

Una vez instalado y configurado:

1. **Abre el panel de Continue:**
   - Presiona `Ctrl+Shift+L` o
   - Click en el icono de Continue en la barra lateral

2. **Chat con la IA:**
   - Escribe tu pregunta
   - Puede leer archivos del proyecto
   - Puede editar múltiples archivos
   - Puede ejecutar comandos

3. **Selecciona código y pregunta:**
   - Selecciona código
   - Presiona `Ctrl+L`
   - Pregunta sobre ese código específico

4. **Autocompletado:**
   - Escribe código
   - Continue sugerirá automáticamente
   - Presiona `Tab` para aceptar

---

## Mi Recomendación Personal

**Para empezar (GRATIS):**
1. Instala **Ollama** con `deepseek-coder:6.7b`
2. Prueba Continue.dev gratis y sin límites
3. Si tu PC es lento, prueba **Gemini** (también gratis)

**Si quieres lo mejor:**
1. Usa **Claude** con API Key (~$3-5/mes)
2. Es prácticamente igual que Claude Code
3. Pago por uso, sin suscripción mensual

**Backup de emergencia:**
- Deja **Ollama** instalado por si pierdes internet
- Funciona 100% offline

---

## Comparación de Costos

| Opción | Costo Mensual | Inteligencia | Internet |
|--------|---------------|--------------|----------|
| **Ollama** | $0 (gratis) | ⭐⭐⭐ | ❌ No requiere |
| **Gemini** | $0 (gratis hasta límite) | ⭐⭐⭐⭐ | ✅ Requiere |
| **Claude API** | ~$3-5/mes | ⭐⭐⭐⭐⭐ | ✅ Requiere |
| **GPT-4 API** | ~$5-10/mes | ⭐⭐⭐⭐⭐ | ✅ Requiere |
| **Claude Code** | $20/mes | ⭐⭐⭐⭐⭐ | ✅ Requiere |
| **Cursor** | $20/mes | ⭐⭐⭐⭐⭐ | ✅ Requiere |

---

## Solución de Problemas

### Continue no aparece en VSCode
- Reinicia VSCode
- Verifica que la extensión esté habilitada
- Presiona `Ctrl+Shift+L` para abrir el panel

### Ollama no funciona
```bash
# Verifica que Ollama esté corriendo:
ollama list

# Reinicia Ollama:
# En Windows: Abre "Ollama" desde el menú inicio
```

### API Key no funciona
- Verifica que copiaste la key completa
- Asegúrate de tener créditos (OpenAI) o cuenta activa
- Revisa que el modelo existe y está disponible

---

## Soporte

- **Continue.dev Docs:** https://docs.continue.dev
- **Ollama Models:** https://ollama.ai/library
- **Discord Continue:** https://discord.gg/continue-dev

---

## Próximos Pasos

1. ✅ Instala Continue.dev
2. ✅ Elige un modelo (recomiendo Ollama para empezar)
3. ✅ Configura `config.yaml`
4. ✅ Prueba con: "Explica el archivo admin-server.js"
5. ✅ Si funciona bien, ya tienes backup de Claude Code!
