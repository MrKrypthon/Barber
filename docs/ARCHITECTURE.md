# Arquitectura

## Principios

- Monolito Modular
- API REST versionada (`/api/v1`)
- Mobile First
- Multi Tenant
- Offline First como objetivo de arquitectura a futuro, no del MVP (ver `docs/ROADMAP.md`)

---

## Frontend (Web)

- Next.js
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form + Zod
- Capacidades PWA

---

## Mobile (diferido post-MVP)

- React Native
- Expo
- TypeScript

Aplicación nativa de primer nivel para Android/iOS. No se desarrolla durante el MVP; el monorepo reserva `apps/mobile/` desde el inicio (ver ADR-007).

---

## Backend

- Node.js
- NestJS
- TypeScript
- JWT (access + refresh token)

---

## Panel de SuperAdmin

Gestión manual de suscripciones (ADR-009, `docs/DECISIONS.md`) — completamente separado del resto de la app, no un rol más dentro del multi-tenancy:

- Modelo `SuperAdmin` aparte de `User` (no pertenece a ningún tenant).
- JWT propio (`SUPERADMIN_JWT_SECRET`/`SUPERADMIN_JWT_REFRESH_SECRET`, estrategia de Passport `"jwt-superadmin"` en vez de `"jwt"`).
- Frontend en `/superadmin/*`, con su propio storage de tokens y su propia instancia de cliente HTTP (`createSuperAdminApiClient`).

Nunca expone datos de negocio (clientes, ventas, turnos, caja, inventario) de ningún tenant — solo nombre, contacto del dueño y estado de la suscripción.

---

## Base de datos

PostgreSQL

Prisma ORM

tenant_id en todas las tablas.

---

## Infraestructura

Hetzner Cloud (ADR-010, `docs/DECISIONS.md`)

Ubuntu

Docker

Docker Compose

Nginx

Let's Encrypt

Runbook completo de despliegue: `docs/DEPLOYMENT.md`.

---

## Flujo

Cliente

↓

Next.js (Web/PWA)

↓

API REST NestJS

↓

PostgreSQL (vía Prisma)
