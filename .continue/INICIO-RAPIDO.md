# 🚀 Inicio Rápido - Continue.dev

## Instalación en 3 pasos (10 minutos)

### Paso 1: Instalar Continue.dev
1. Abre **VSCode**
2. Presiona `Ctrl+Shift+X`
3. Busca: **"Continue"**
4. Instala la extensión
5. Reinicia VSCode

### Paso 2: Elegir opción (elige UNA)

#### Opción A: GRATIS sin internet (Ollama)
```bash
# 1. Descarga Ollama: https://ollama.ai/download
# 2. Instala Ollama (siguiente, siguiente, finalizar)
# 3. Ejecuta este script:
.continue\install-ollama.bat

# Listo! Ya funciona gratis y offline
```

#### Opción B: GRATIS con internet (Gemini)
```bash
# 1. Ve a: https://aistudio.google.com/apikey
# 2. Inicia sesión con Google
# 3. Crea API Key
# 4. Copia la key
# 5. Edita: .continue\config.yaml
# 6. Busca "Gemini" y pega tu API Key
```

#### Opción C: Mejor calidad (Claude API ~$3/mes)
```bash
# 1. Ve a: https://console.anthropic.com/
# 2. Crea cuenta
# 3. Ve a "API Keys" → "Create Key"
# 4. Añade $5 de crédito
# 5. Copia la key (sk-ant-api03-...)
# 6. Edita: .continue\config.yaml
# 7. Busca "Claude" y pega tu API Key
```

### Paso 3: Usar Continue.dev
1. Presiona `Ctrl+Shift+L` en VSCode
2. Escribe: "Explica el archivo admin-server.js"
3. ¡Listo! Ya tienes tu asistente IA funcionando

---

## Comandos Útiles

- `Ctrl+Shift+L` - Abrir panel de Continue
- `Ctrl+L` - Preguntar sobre código seleccionado
- `Tab` - Aceptar sugerencia de autocompletado
- `/edit` - Editar código actual
- `/comment` - Agregar comentarios

---

## ¿Cuál opción elegir?

| Si quieres... | Usa... |
|--------------|--------|
| 100% gratis y sin internet | **Ollama** |
| Gratis pero necesita internet | **Gemini** |
| Lo mejor (como Claude Code) | **Claude API** |
| Alternativa a Claude | **GPT-4** |

---

## Verificar que funciona

```bash
# Si usas Ollama:
ollama list
# Debería mostrar: deepseek-coder:6.7b

# Si usas API (Gemini/Claude/GPT-4):
# Abre Continue (Ctrl+Shift+L) y escribe:
# "Hola, ¿funcionas?"
```

---

## Soporte

Lee la guía completa: `.continue\README-CONTINUE.md`
