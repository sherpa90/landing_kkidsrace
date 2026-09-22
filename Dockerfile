# ==============================================================================
# Dockerfile Ultra-ligero para Landing Page & CMS (Node.js 20 Alpine)
# ==============================================================================

# Etapa 1: Dependencias
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Etapa 2: Imagen Final de Producción (< 90MB)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Crear directorio de datos y uploads con permisos para el usuario sin privilegios 'node'
RUN mkdir -p /app/data/uploads && chown -R node:node /app

# Copiar dependencias y código fuente
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node data ./data
COPY --chown=node:node src ./src

# Usar usuario no root por seguridad
USER node

# Exponer puerto HTTP
EXPOSE 3000

# Comprobación de Salud (Healthcheck)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+process.env.PORT||3000+'/robots.txt', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1))"

# Comando de inicio
CMD ["node", "src/server.js"]
