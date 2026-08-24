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

## WhatsApp (API oficial de Meta)

Recordatorios de turno y recibos de pago por WhatsApp (ADR-011, `docs/DECISIONS.md`), vía la Cloud API de Meta — sin SDK, un cliente HTTP delgado sobre `fetch` (`WhatsAppApiService`).

- Credenciales por tenant (`WhatsAppConnection`): cada negocio conecta su propia app de WhatsApp Business desde Configuración.
- `RemindersCron` (`@nestjs/schedule`, cada 15 minutos) manda un recordatorio por plantilla a los turnos que arrancan en ~2 horas y aún no lo recibieron (`Appointment.reminderSentAt`); el dueño puede apagarlo desde Configuración (`BusinessSettings.remindersEnabled`, default `true`) sin desconectar el WhatsApp del negocio.
- `WhatsAppReceiptService` genera la imagen del recibo (SVG armado a mano, rasterizado con `sharp`) y lo manda al confirmar una venta, en paralelo (`sendReceiptSafely`, fire-and-forget) — nunca bloquea ni hace fallar el cobro.
- `POST /whatsapp/webhook` verifica la firma HMAC-SHA256 de cada evento entrante contra `WHATSAPP_APP_SECRET` antes de procesarlo; por ahora solo registra los eventos en el log (reservar turnos por mensaje queda para una segunda etapa).

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
