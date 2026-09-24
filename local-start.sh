#!/usr/bin/env bash
# Iniciar Modern Landing Page & CMS en modo Local en macOS / Linux
set -e

echo "==================================================="
echo "Iniciando Modern Landing Page & CMS en modo Local..."
echo "==================================================="

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js no está instalado o no se encuentra en el PATH."
  echo "Por favor instala Node.js (v18 o superior) o usa Docker: ./docker-start.sh"
  exit 1
fi

node src/server.js
