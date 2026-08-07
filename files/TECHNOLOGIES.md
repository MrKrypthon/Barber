# TECHNOLOGIES.md

# Tecnologías del Proyecto

**Proyecto:** Barber SaaS

**Versión:** 0.1

---

# Objetivo

Este documento define el stack tecnológico oficial del proyecto.

Toda decisión técnica deberá respetar este documento.

El objetivo principal es mantener una arquitectura simple, moderna, escalable y de bajo costo de operación, permitiendo desarrollar el proyecto rápidamente con ayuda de herramientas de IA.

---

# Filosofía Tecnológica

El proyecto prioriza:

- Simplicidad
- Bajo costo
- Escalabilidad
- Fácil mantenimiento
- Desarrollo rápido
- Excelente experiencia móvil
- Código limpio
- Arquitectura modular

No se adoptarán tecnologías únicamente por tendencia.

Toda tecnología deberá aportar valor real al proyecto.

---

# Arquitectura General

El sistema estará compuesto por una única aplicación distribuida en tres capas principales:

```
                        Usuarios

        📱 Android
        📱 iPhone
        💻 Computadora
        📱 Tablet

                    │

                    ▼

        Progressive Web App (PWA)

                    │
              HTTPS / REST

                    ▼

      Backend (Spring Boot API)

                    │

                    ▼

              PostgreSQL

                    │

                    ▼

      Oracle Cloud Free Tier
```

Durante las primeras versiones todo correrá dentro de un único VPS.

---

# Frontend

El frontend será una **Progressive Web App (PWA)**.

## ¿Por qué una PWA?

Porque ofrece las ventajas de una aplicación móvil sin la complejidad inicial de desarrollar aplicaciones nativas.

Beneficios:

- Instalable en Android.
- Instalable en iPhone.
- Funciona desde navegador.
- Puede ejecutarse en pantalla completa.
- Actualizaciones automáticas.
- Una sola base de código.
- Sin depender inicialmente de Google Play o App Store.
- Compatible con escritorio.

En el futuro podrá convertirse en aplicación nativa mediante Capacitor si el negocio lo requiere.

---

## Tecnologías

### React

Framework principal del frontend.

Responsable de toda la interfaz de usuario.

---

### TypeScript

Lenguaje principal.

Se utilizará en todo el frontend.

No se utilizará JavaScript puro.

---

### Vite

Herramienta de desarrollo y compilación.

Elegido por:

- rapidez
- simplicidad
- excelente integración con React

---

### Tailwind CSS

Framework CSS.

Se utilizará para toda la interfaz.

No se utilizarán frameworks como Bootstrap o Material UI en el MVP.

---

### React Router

Manejo de navegación.

---

### TanStack Query

Manejo del estado remoto.

Toda comunicación con el backend deberá utilizar TanStack Query.

---

### React Hook Form

Manejo de formularios.

---

### Zod

Validación de formularios.

---

### PWA Plugin

Permitirá:

- instalación
- cache
- funcionamiento offline
- service workers

---

# Backend

El backend será desarrollado utilizando Java.

---

## Java

Versión

Java 21 LTS

---

## Spring Boot

Framework principal.

Será utilizado para:

- API REST
- Seguridad
- Persistencia
- Configuración

---

## Spring Security

Autenticación.

Autorización.

Protección de endpoints.

---

## JWT

Autenticación Stateless.

No se utilizarán sesiones.

---

## Spring Data JPA

Persistencia.

---

## Hibernate

ORM principal.

---

## Flyway

Migraciones de base de datos.

Toda modificación de la base deberá realizarse mediante migraciones.

Nunca directamente.

---

## MapStruct

Conversión entre:

- Entity
- DTO

Evitar lógica manual repetitiva.

---

## Maven

Administrador de dependencias.

---

# Base de Datos

## PostgreSQL

Base oficial del proyecto.

Motivos:

- gratuita
- robusta
- rápida
- ampliamente soportada

---

## Modelo

Multi Tenant

Cada tabla incluirá:

tenant_id

No existirá una base por cliente.

Esto reduce considerablemente los costos.

---

# Infraestructura

Durante el MVP se utilizará únicamente infraestructura gratuita.

---

## Oracle Cloud Free Tier

Será el servidor principal.

Ventajas:

- Gratis.
- Excelente rendimiento.
- Recursos suficientes para el MVP.

---

## Sistema Operativo

Ubuntu Server LTS

---

## Docker

Todo el proyecto se ejecutará mediante contenedores.

---

## Docker Compose

Permitirá ejecutar:

- Backend
- PostgreSQL
- Nginx

Con un único comando.

---

## Nginx

Responsable de:

- servir el frontend
- proxy reverso
- HTTPS
- compresión

---

## Let's Encrypt

Certificados SSL gratuitos.

---

# Arquitectura del Backend

Se utilizará un **Monolito Modular**.

No se utilizarán microservicios.

Cada módulo será independiente.

Ejemplo:

```
auth

customers

services

sales

cash

business

settings
```

Cada módulo contendrá:

- Controller
- Service
- Repository
- Entity
- DTO
- Mapper
- Validator

---

# Arquitectura del Frontend

```
src/

modules/

shared/

components/

layouts/

hooks/

services/

routes/

assets/
```

Cada módulo tendrá:

- páginas
- componentes
- hooks
- servicios
- tipos

---

# Responsive Design

El proyecto será **Mobile First**.

Todo se diseñará primero para celulares.

Posteriormente se adaptará a tablets y computadoras.

No existirán dos aplicaciones diferentes.

Será una única PWA adaptable.

---

# Offline First

El sistema deberá soportar operaciones básicas aun cuando no exista conexión.

Ejemplos:

- registrar ventas
- consultar clientes recientes
- consultar servicios
- registrar gastos

Cuando vuelva Internet:

Los datos deberán sincronizarse automáticamente.

---

# Integraciones futuras

No forman parte del MVP.

Se agregarán mediante módulos independientes.

## WhatsApp Business

Reservaciones.

Recordatorios.

Promociones.

---

## Stripe

Pagos con tarjeta.

Anticipos.

Membresías.

---

## IA

Análisis financiero.

Predicciones.

Recomendaciones.

Reportes inteligentes.

---

## Facturación SAT

CFDI.

Facturas.

Complementos.

---

# Desarrollo asistido por IA

El proyecto será desarrollado utilizando:

- Claude Code
- OpenCode
- ChatGPT
- Claude Designer (mockups y flujos de interfaz)

Toda IA deberá respetar la documentación oficial del proyecto.

---

# Convenciones Técnicas

## Backend

- Java 21
- Spring Boot
- REST API
- DTO
- JWT
- Arquitectura Modular

---

## Frontend

- React
- TypeScript
- Hooks
- TanStack Query
- Tailwind

---

## Base de Datos

- PostgreSQL
- UUID como identificadores
- tenant_id obligatorio
- created_at
- updated_at

---

# Escalabilidad

La arquitectura está preparada para crecer sin reescribir el proyecto.

Evolución prevista:

## Etapa 1

Un VPS Oracle.

Frontend + Backend + PostgreSQL.

---

## Etapa 2

Separar PostgreSQL.

---

## Etapa 3

Separar almacenamiento de archivos.

---

## Etapa 4

Separar API.

---

## Etapa 5

Convertir módulos específicos en microservicios únicamente si existe una necesidad real.

La arquitectura actual no limita esta evolución.

---

# Resumen del Stack

| Capa | Tecnología |
|-------|------------|
| Frontend | React 19 |
| Lenguaje Frontend | TypeScript |
| Build Tool | Vite |
| Estilos | Tailwind CSS |
| Estado remoto | TanStack Query |
| Formularios | React Hook Form |
| Validación | Zod |
| Navegación | React Router |
| Aplicación | Progressive Web App (PWA) |
| Backend | Java 21 |
| Framework Backend | Spring Boot |
| Seguridad | Spring Security + JWT |
| Persistencia | Spring Data JPA |
| ORM | Hibernate |
| Migraciones | Flyway |
| Mapeo DTO | MapStruct |
| Build Backend | Maven |
| Base de datos | PostgreSQL |
| Contenedores | Docker |
| Orquestación | Docker Compose |
| Proxy | Nginx |
| SSL | Let's Encrypt |
| Infraestructura | Oracle Cloud Free Tier |
| Desarrollo con IA | Claude Code, OpenCode, ChatGPT |
| Diseño UI/UX | Claude Designer |

---

# Regla Principal

Antes de incorporar una nueva tecnología deberán responderse las siguientes preguntas:

1. ¿Aporta valor al usuario?
2. ¿Reduce tiempo de desarrollo?
3. ¿Reduce costos?
4. ¿Hace el proyecto más fácil de mantener?
5. ¿Es compatible con la arquitectura modular?

Si la respuesta a la mayoría de estas preguntas es **no**, la tecnología no deberá incorporarse al proyecto.
