#!/usr/bin/env bash
# Iniciar Modern Landing Page & CMS con Docker Compose en macOS / Linux
set -e

echo "==================================================="
echo "Iniciando Modern Landing Page & CMS en Docker..."
echo "==================================================="

docker compose up -d --build

echo ""
echo "==================================================="
echo "Aplicación lista:"
echo "- Landing Page: http://localhost:3000"
echo "- Panel CMS:    http://localhost:3000/admin"
echo "  Usuario: admin   /  Password: admin"
echo "==================================================="
