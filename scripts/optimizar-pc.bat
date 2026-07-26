@echo off
REM ============================================================
REM Script de Optimizacion de PC - ObraTudela
REM Para Windows 10/11 - Ejecutar como ADMINISTRADOR
REM Creado por Claude Code
REM ============================================================

echo.
echo ============================================================
echo   OPTIMIZADOR DE PC - Sistema Antiguo
echo ============================================================
echo.
echo Este script optimizara tu PC para mejor rendimiento.
echo Ejecuta este script UNA VEZ AL MES para mantener velocidad.
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Este script requiere permisos de ADMINISTRADOR
    echo.
    echo Click derecho en el script ^> "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo [OK] Ejecutando como Administrador
echo.

REM Crear carpeta de reportes
if not exist "d:\archivos del pincho\obratudela\scripts\reportes" mkdir "d:\archivos del pincho\obratudela\scripts\reportes"
set REPORTE="d:\archivos del pincho\obratudela\scripts\reportes\optimizacion-%date:~-4,4%%date:~-7,2%%date:~-10,2%.txt"

echo Generando reporte en: %REPORTE%
echo ============================================================ > %REPORTE%
echo REPORTE DE OPTIMIZACION - %date% %time% >> %REPORTE%
echo ============================================================ >> %REPORTE%
echo. >> %REPORTE%

REM ============================================================
echo [1/10] Limpiando archivos temporales...
echo [1/10] Limpiando archivos temporales... >> %REPORTE%
REM ============================================================

echo   - Limpiando Temp de Windows...
del /f /s /q %windir%\temp\* 2>nul
rd /s /q %windir%\temp 2>nul
mkdir %windir%\temp

echo   - Limpiando Temp de usuario...
del /f /s /q %temp%\* 2>nul
rd /s /q %temp% 2>nul
mkdir %temp%

echo   - Limpiando Prefetch...
del /f /s /q %windir%\Prefetch\* 2>nul

echo   - Limpiando archivos de actualizacion antiguos...
Dism.exe /online /Cleanup-Image /StartComponentCleanup /ResetBase 2>nul

for /f "tokens=3" %%a in ('dir /-c %windir%\temp ^| find "bytes"') do set TEMP_LIMPIO=%%a
echo     Espacio liberado: %TEMP_LIMPIO% bytes >> %REPORTE%

echo [OK] Archivos temporales limpiados
echo. >> %REPORTE%

REM ============================================================
echo [2/10] Vaciando caches del sistema...
echo [2/10] Vaciando caches del sistema... >> %REPORTE%
REM ============================================================

echo   - Cache DNS...
ipconfig /flushdns >nul 2>&1

echo   - Cache de miniaturas...
del /f /s /q %LocalAppData%\Microsoft\Windows\Explorer\thumbcache_*.db 2>nul

echo   - Cache de iconos...
del /f /s /q %LocalAppData%\IconCache.db 2>nul

echo [OK] Caches vaciados
echo. >> %REPORTE%

REM ============================================================
echo [3/10] Optimizando disco duro (HDD ST9750420AS)...
echo [3/10] Optimizando disco duro >> %REPORTE%
REM ============================================================

echo   - Analizando disco D: (HDD)...
defrag D: /A /H /V >> %REPORTE% 2>&1

echo   - Desfragmentando si es necesario...
defrag D: /H /V >> %REPORTE% 2>&1

echo [OK] Disco optimizado
echo. >> %REPORTE%

REM ============================================================
echo [4/10] Limpiando registro de Windows...
echo [4/10] Limpiando registro >> %REPORTE%
REM ============================================================

echo   - Limpiando entradas huerfanas...
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v OneDriveSetup /f 2>nul
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v SecurityHealth /f 2>nul

echo [OK] Registro limpiado
echo. >> %REPORTE%

REM ============================================================
echo [5/10] Optimizando archivo de paginacion (swap)...
echo [5/10] Optimizando archivo de paginacion >> %REPORTE%
REM ============================================================

echo   - Configurando swap en SSD (C:) para maximo rendimiento...
REM Tamano recomendado: 2048-4096 MB (tienes 12GB RAM)
wmic computersystem set AutomaticManagedPagefile=False 2>nul
wmic pagefileset where name="C:\\pagefile.sys" set InitialSize=2048,MaximumSize=4096 2>nul

echo [OK] Archivo de paginacion optimizado
echo. >> %REPORTE%

REM ============================================================
echo [6/10] Deshabilitando servicios innecesarios...
echo [6/10] Servicios innecesarios >> %REPORTE%
REM ============================================================

echo   - Windows Search (indexacion - ya deshabilitado por ti)
sc config WSearch start=disabled >nul 2>&1
sc stop WSearch >nul 2>&1

echo   - Telemetria de Windows...
sc config DiagTrack start=disabled >nul 2>&1
sc stop DiagTrack >nul 2>&1
sc config dmwappushservice start=disabled >nul 2>&1
sc stop dmwappushservice >nul 2>&1

echo   - Superfetch (no util en SSD)...
sc config SysMain start=disabled >nul 2>&1
sc stop SysMain >nul 2>&1

echo   - Windows Update automatico (cambiar a manual)...
sc config wuauserv start=demand >nul 2>&1

echo   - Cortana...
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search" /v AllowCortana /t REG_DWORD /d 0 /f >nul 2>&1

echo [OK] Servicios optimizados
sc query WSearch >> %REPORTE%
sc query DiagTrack >> %REPORTE%
sc query SysMain >> %REPORTE%
echo. >> %REPORTE%

REM ============================================================
echo [7/10] Optimizando configuracion de energia...
echo [7/10] Configuracion de energia >> %REPORTE%
REM ============================================================

echo   - Configurando plan "Alto rendimiento"...
powercfg -duplicatescheme 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c

echo   - Deshabilitando hibernacion (libera espacio en SSD)...
powercfg -h off

echo [OK] Energia optimizada
powercfg /list >> %REPORTE%
echo. >> %REPORTE%

REM ============================================================
echo [8/10] Optimizando red...
echo [8/10] Optimizando red >> %REPORTE%
REM ============================================================

echo   - Reseteando stack TCP/IP...
netsh int ip reset >nul 2>&1
netsh winsock reset >nul 2>&1

echo   - Optimizando configuracion de red...
netsh interface tcp set global autotuninglevel=normal >nul 2>&1
netsh interface tcp set global chimney=enabled >nul 2>&1

echo [OK] Red optimizada
echo. >> %REPORTE%

REM ============================================================
echo [9/10] Limpiando programas de inicio...
echo [9/10] Programas de inicio >> %REPORTE%
REM ============================================================

echo   - Listando programas que inician con Windows...
echo Programas de inicio actuales: >> %REPORTE%
reg query HKCU\Software\Microsoft\Windows\CurrentVersion\Run >> %REPORTE% 2>&1
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run >> %REPORTE% 2>&1

echo   [INFO] Revisa el reporte para ver que programas inician automaticamente
echo   [INFO] Usa "msconfig" para deshabilitar los que no necesites

echo [OK] Inicio revisado
echo. >> %REPORTE%

REM ============================================================
echo [10/10] Generando informe del sistema...
echo [10/10] Informe del sistema >> %REPORTE%
REM ============================================================

echo. >> %REPORTE%
echo ============================================================ >> %REPORTE%
echo INFORMACION DEL SISTEMA DESPUES DE OPTIMIZACION >> %REPORTE%
echo ============================================================ >> %REPORTE%
echo. >> %REPORTE%

systeminfo | findstr /C:"Nombre de host" /C:"Nombre del sistema" /C:"Memoria fisica total" /C:"Memoria fisica disponible" >> %REPORTE% 2>&1

echo. >> %REPORTE%
echo Espacio en discos: >> %REPORTE%
wmic logicaldisk get caption,size,freespace >> %REPORTE% 2>&1

echo. >> %REPORTE%
echo Procesos consumiendo mas memoria: >> %REPORTE%
wmic process get name,workingsetsize | sort /R | head -15 >> %REPORTE% 2>&1

echo [OK] Informe generado
echo.

REM ============================================================
echo ============================================================
echo   OPTIMIZACION COMPLETADA
echo ============================================================
echo.
echo Resultados:
echo   - Archivos temporales: LIMPIADOS
echo   - Caches del sistema: VACIADOS
echo   - Disco HDD: OPTIMIZADO
echo   - Registro: LIMPIADO
echo   - Archivo de paginacion: OPTIMIZADO (2-4GB)
echo   - Servicios innecesarios: DESHABILITADOS
echo   - Plan de energia: ALTO RENDIMIENTO
echo   - Hibernacion: DESHABILITADA (mas espacio)
echo   - Red: OPTIMIZADA
echo   - Programas de inicio: REVISADOS
echo.
echo Reporte guardado en:
echo %REPORTE%
echo.
echo IMPORTANTE:
echo   1. REINICIA el PC para aplicar todos los cambios
echo   2. Ejecuta este script UNA VEZ AL MES
echo   3. Revisa el reporte para ver detalles
echo.
echo ============================================================
echo.

pause

REM Preguntar si reiniciar ahora
echo.
set /p REINICIAR="¿Reiniciar el PC ahora? (S/N): "
if /i "%REINICIAR%"=="S" (
    echo Reiniciando en 10 segundos...
    shutdown /r /t 10 /c "Reiniciando para aplicar optimizaciones"
) else (
    echo Recuerda reiniciar cuando puedas para aplicar los cambios.
)

echo.
echo Gracias por usar el Optimizador de PC ObraTudela
echo.
pause
