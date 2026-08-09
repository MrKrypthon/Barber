# Barber SaaS

> Documento maestro del proyecto
>
> Versión: 0.2
>
> Estado: En diseño
>
> Última actualización: 2026-08-08 — stack reconciliado con `docs/TECHNOLOGIES.md` (ver ADR-006 y ADR-007 en `docs/DECISIONS.md`)

---

# Visión

Construir el SaaS más simple para administrar negocios de servicios en Latinoamérica, comenzando por barberías y estéticas.

El objetivo NO es competir con un ERP.

El objetivo es permitir que cualquier negocio pueda administrar sus ventas, caja y clientes desde un teléfono móvil en menos de cinco segundos por operación.

---

# Filosofía

El software debe adaptarse al negocio.

Nunca obligaremos al usuario a cambiar la forma en la que trabaja.

La mayoría de las barberías en México trabajan así:

Cliente llega

↓

Espera

↓

Lo atienden

↓

Paga

↓

Se va

Y las reservaciones normalmente llegan por WhatsApp.

Nuestro sistema debe integrarse a este flujo.

Nunca al revés.

---

# Objetivos

- Muy simple de usar
- Muy barato de mantener
- Arquitectura modular
- Escalable
- Multiempresa (SaaS)
- Mobile First
- Offline First
- Preparado para IA

---

# Público objetivo

Primera etapa

- Barberías

Segunda etapa

- Estéticas

Posteriormente

- Spas
- Salones de belleza
- Estudios de tatuajes
- Negocios de servicios similares

---

# Modelo SaaS

Una sola plataforma.

Muchos negocios.

Cada negocio tiene:

- nombre
- logo
- colores
- empleados
- clientes
- servicios
- ventas

Todo aislado mediante tenant_id.

No existirán instalaciones independientes.

---

# Branding

Cada negocio podrá modificar

- Nombre
- Logo
- Color principal
- Color secundario
- Dirección
- Teléfono
- Horario

No podrá modificar

- Diseño
- Navegación
- Componentes

Toda la personalización será mediante configuración.

---

# MVP

## Login

- correo
- contraseña

Roles

- Dueño
- Empleado

---

## Dashboard

Mostrar únicamente

Ventas del día

Clientes atendidos

Caja actual

---

## Clientes

Campos

- Nombre
- Teléfono
- Notas

También existirá

Cliente ocasional

---

## Servicios

Cada negocio podrá administrar

- nombre
- precio
- activo

---

## Venta

Flujo

Nueva venta

↓

Seleccionar cliente

↓

Seleccionar servicios

↓

Método de pago

- efectivo
- transferencia

↓

Guardar

Debe tomar menos de cinco segundos.

---

## Caja

Mostrar

Ingresos

Egresos

Caja actual

Registrar gastos manuales.

---

## Historial

Ventas

Filtros

- Hoy
- Semana
- Mes

---

## Configuración

Modificar

Logo

Nombre

Colores

Horarios

Teléfono

Dirección

---

# Lo que NO estará en el MVP

No desarrollar

- Agenda
- Stripe
- Pagos con tarjeta
- Inventario
- IA
- Facturación SAT
- Multi sucursal
- Reportes avanzados

Todo eso será posterior.

---

# WhatsApp

El software NO reemplazará WhatsApp.

Las barberías ya utilizan WhatsApp.

Nos integraremos con ese flujo.

Primera etapa

Botón

Reservar por WhatsApp

Abrirá

https://wa.me/

con mensaje predefinido.

Segunda etapa

Agenda manual.

El empleado registrará las citas recibidas por WhatsApp.

Tercera etapa

API oficial de WhatsApp Business.

Automatización.

---

# Arquitectura

## Frontend (Web)

Next.js

React

TypeScript

TailwindCSS

TanStack Query

React Hook Form + Zod

Capacidades PWA (instalable, sin depender de App Store)

Mobile First

> Offline First es un objetivo de arquitectura a futuro, no un entregable del MVP. Ver `docs/TECHNOLOGIES.md` §35 y `CLAUDE.md` §20.

---

## Mobile

React Native + Expo

TypeScript

Aplicación de primer nivel, no una copia de la Web.

Su implementación queda **diferida hasta después del MVP** (ver `docs/ROADMAP.md` v1.0 y ADR-007). El monorepo reserva `apps/mobile/` desde el inicio para no reestructurar más adelante.

---

## Backend

Node.js

NestJS

TypeScript

JWT (access + refresh token)

REST API

Arquitectura Modular

Monolito Modular

No Microservicios.

---

## Base de datos

PostgreSQL

Prisma ORM

Todas las tablas tendrán

tenant_id

No existirá una base por cliente.

---

## Infraestructura

Oracle Cloud Free Tier

Ubuntu

Docker

Docker Compose

Nginx

Let's Encrypt

Todo correrá inicialmente en un solo servidor.

---

# Arquitectura General

Internet

↓

Nginx

↓

Frontend Next.js (PWA)

↓

Backend NestJS

↓

PostgreSQL

---

# Organización del repositorio

barber-saas/

apps/

&nbsp;&nbsp;web/ (Next.js)

&nbsp;&nbsp;api/ (NestJS)

&nbsp;&nbsp;mobile/ (React Native + Expo, reservado)

packages/

&nbsp;&nbsp;types/

&nbsp;&nbsp;validation/

&nbsp;&nbsp;api-client/

&nbsp;&nbsp;config/

docs/

docker/

.github/

---

# Backend

apps/api/src/

auth

tenants

users

customers

services

sales

cash

settings

notifications

shared

Cada módulo será independiente.

---

# Frontend

apps/web/src/

modules/

shared/

components/

layouts/

hooks/

services/

routes/

assets/

Cada funcionalidad será un módulo.

---

# Base de datos

Tablas iniciales

tenants

users

roles

customers

services

sales

sale_items

cash_movements

business_settings

---

# Principios de desarrollo

Todo debe poder hacerse en menos de tres toques.

Evitar escribir texto.

Utilizar botones grandes.

Toda pantalla debe funcionar desde un celular.

No desarrollar funcionalidades "por si acaso".

Construir únicamente lo que aporte valor.

---

# Experiencia de usuario

Empleado

Registrar ventas

Consultar clientes

Registrar gastos

Nada más.

Dueño

Dashboard

Caja

Configuración

Empleados

Estadísticas

---

# Roadmap

## v0.1

Login

Negocio

Clientes

Servicios

Ventas

Caja

Configuración

---

## v0.2

Agenda

Comisiones

Empleados

Dashboard

---

## v0.3

Inventario

Reportes

Gastos

---

## v0.4

WhatsApp

Recordatorios

Promociones

---

## v1.0

Stripe

IA

Facturación SAT

Multi sucursal

Aplicaciones móviles

---

# Desarrollo con IA

Este proyecto está diseñado para desarrollarse asistido por IA.

Herramientas previstas

- Claude Code
- OpenCode
- ChatGPT
- Claude Designer (mockups)

La IA deberá respetar siempre este documento.

Si existe conflicto entre una propuesta y este documento, prevalece PROJECT.md.

---

# Reglas para la IA

No cambiar arquitectura.

No introducir microservicios.

No agregar librerías innecesarias.

Priorizar simplicidad.

Escribir código limpio.

Aplicar principios SOLID cuando agreguen valor.

Evitar sobreingeniería.

Mantener el proyecto modular.

Generar documentación junto con el código.

Todo cambio importante deberá reflejarse en docs/DECISIONS.md.

---

# Objetivo técnico

Poder soportar al menos

- 50 barberías

- 5 empleados por barbería

utilizando únicamente Oracle Cloud Free Tier.

---

# Visión a largo plazo

El proyecto no busca ser únicamente un software para barberías.

Busca convertirse en una plataforma SaaS para negocios de servicios.

La barbería será únicamente el primer vertical.
