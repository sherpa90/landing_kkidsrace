@echo off
echo ===================================================
echo Iniciando Modern Landing Page ^& CMS en modo Local...
echo ===================================================
set "PATH=%~dp0..\tools\node-win;%PATH%"
node src/server.js
pause
