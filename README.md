# Barber SaaS

SaaS simple para administrar ventas, caja y clientes en barberías y negocios de servicios.

Documentación completa en [`docs/`](./docs) — empieza por [`docs/PROJECT.md`](./docs/PROJECT.md) y [`docs/TECHNOLOGIES.md`](./docs/TECHNOLOGIES.md). Reglas para el desarrollo asistido por IA en [`CLAUDE.md`](./CLAUDE.md).

## Stack

TypeScript en toda la plataforma: Next.js (web) + NestJS (api) + Prisma/PostgreSQL. Ver `docs/DECISIONS.md` (ADR-006, ADR-007) para el porqué.

## Estructura

```text
apps/
  web/       Next.js (App Router, Tailwind, TanStack Query)
  api/       NestJS (REST /api/v1, Prisma)
  mobile/    Reservado — React Native + Expo, diferido post-MVP (ver ADR-007)
packages/
  types/         Tipos compartidos
  validation/    Schemas Zod compartidos
  api-client/    Cliente HTTP tipado hacia la API
  config/        tsconfig / eslint / prettier compartidos
docker/          Dockerfiles de desarrollo
docs/            Documentación del proyecto
```

## Requisitos

- Node.js 20+ (ver `.nvmrc`)
- pnpm (vía `corepack enable`, o `npx pnpm@9` si tu entorno no tiene corepack)
- Docker + Docker Compose (opcional para desarrollo local con contenedores)

## Quickstart

```bash
cp .env.example .env
pnpm install

# Opción A: todo en Docker (postgres + api + web)
docker compose up

# Opción B: Postgres en Docker, apps en local con hot reload nativo
docker compose up postgres
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001/api/v1/health

## Comandos comunes

```bash
pnpm dev         # web + api en modo desarrollo
pnpm build       # build de producción de cada app
pnpm lint        # eslint en todos los workspaces
pnpm typecheck   # tsc --noEmit en todos los workspaces
pnpm test        # tests de cada app
```

## Estado

MVP en construcción. Ver `docs/ROADMAP.md` para el plan de versiones y `docs/DECISIONS.md` para las decisiones de arquitectura registradas.
