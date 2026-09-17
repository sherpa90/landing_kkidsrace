@echo off
echo ===================================================
echo Iniciando Modern Landing Page ^& CMS en Docker...
echo ===================================================
docker compose up -d --build
echo.
echo ===================================================
echo Aplicacion lista:
echo - Landing Page: http://localhost:3000
echo - Panel CMS:    http://localhost:3000/admin
echo   Usuario: admin   /  Password: admin
echo ===================================================
pause
