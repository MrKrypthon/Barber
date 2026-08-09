# Dockerfile de desarrollo (hot reload vía bind mount en docker-compose.yml).
# La imagen de producción multi-stage se añade en Fase 6 (Despliegue).
FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["pnpm", "dev"]
