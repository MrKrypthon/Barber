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

## Base de datos

PostgreSQL

Prisma ORM

tenant_id en todas las tablas.

---

## Infraestructura

Oracle Cloud Free Tier

Ubuntu

Docker

Docker Compose

Nginx

Let's Encrypt

---

## Flujo

Cliente

↓

Next.js (Web/PWA)

↓

API REST NestJS

↓

PostgreSQL (vía Prisma)
