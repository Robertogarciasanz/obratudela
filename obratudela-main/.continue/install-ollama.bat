@echo off
REM Script de instalacion rapida de Ollama para Continue.dev
REM Ejecuta este script para configurar Ollama automaticamente

echo ========================================
echo Instalador de Ollama para Continue.dev
echo ========================================
echo.

REM Verificar si Ollama esta instalado
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Ollama no esta instalado.
    echo.
    echo Por favor descarga e instala Ollama desde:
    echo https://ollama.ai/download
    echo.
    echo Despues ejecuta este script nuevamente.
    pause
    exit /b 1
)

echo [OK] Ollama esta instalado
echo.

REM Verificar si Ollama esta corriendo
echo Verificando servicio de Ollama...
ollama list >nul 2>&1
if %errorlevel% neq 0 (
    echo [ADVERTENCIA] Ollama no esta corriendo
    echo Iniciando Ollama...
    start "" "C:\Program Files\Ollama\ollama app.exe"
    timeout /t 5 /nobreak >nul
)

echo [OK] Ollama esta corriendo
echo.

REM Descargar modelo recomendado
echo ========================================
echo Descargando modelo: deepseek-coder:6.7b
echo (Esto puede tardar 5-10 minutos)
echo ========================================
echo.

ollama pull deepseek-coder:6.7b

if %errorlevel% equ 0 (
    echo.
    echo [OK] Modelo descargado exitosamente!
    echo.
    echo ========================================
    echo INSTALACION COMPLETA
    echo ========================================
    echo.
    echo Ahora puedes usar Continue.dev con Ollama.
    echo.
    echo Proximos pasos:
    echo 1. Abre VSCode
    echo 2. Instala la extension "Continue"
    echo 3. Presiona Ctrl+Shift+L para abrir Continue
    echo 4. Ya puedes usar IA gratis y sin internet!
    echo.
    echo Modelos disponibles:
    ollama list
    echo.
) else (
    echo.
    echo [ERROR] No se pudo descargar el modelo
    echo Verifica tu conexion a internet e intenta nuevamente.
    echo.
)

pause
