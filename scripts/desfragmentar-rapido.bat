@echo off
REM ============================================================
REM Desfragmentacion Rapida - Solo HDD (D:)
REM NO desfragmenta SSD (C:) - no es necesario y es perjudicial
REM Ejecutar como ADMINISTRADOR
REM ============================================================

echo.
echo ============================================================
echo   DESFRAGMENTACION RAPIDA - HDD (D:)
echo ============================================================
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Requiere permisos de ADMINISTRADOR
    echo Click derecho ^> "Ejecutar como administrador"
    pause
    exit /b 1
)

echo [OK] Ejecutando como Administrador
echo.
echo IMPORTANTE: Este proceso puede tardar 30-60 minutos
echo dependiendo de la fragmentacion del disco.
echo.
echo Puedes usar el PC mientras se desfragmenta,
echo pero ira mas lento. Mejor dejarlo trabajando.
echo.

pause

echo.
echo ============================================================
echo Analizando disco D: (HDD Seagate 750GB)...
echo ============================================================
echo.

defrag D: /A /V

echo.
echo ============================================================
echo Desfragmentando disco D:...
echo ============================================================
echo.

defrag D: /O /V

echo.
echo ============================================================
echo DESFRAGMENTACION COMPLETADA
echo ============================================================
echo.
echo El disco D: (HDD) ha sido optimizado.
echo.
echo Beneficios:
echo   - Archivos mas continuos en el disco
echo   - Lectura/escritura 20-30%% mas rapida
echo   - Menos desgaste del disco
echo.
echo Frecuencia recomendada:
echo   - 1 vez cada 2 meses (si usas mucho el disco)
echo   - 1 vez cada 6 meses (si usas poco el disco)
echo.

pause
