@echo off
cd /d %~dp0
echo Iniciando servidor...
start "ObraTudela Admin" node admin-server.js
:esperar
timeout /t 1 /nobreak >nul
netstat -aon | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 goto esperar
echo Servidor listo.
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --window-size=900,820
