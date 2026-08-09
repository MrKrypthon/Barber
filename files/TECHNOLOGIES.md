# TECHNOLOGIES.md

# Barber SaaS — Stack Tecnológico

**Versión:** 0.1.0  
**Estado:** Diseño  
**Última actualización:** 2026-08-08

---

# 1. Objetivo

Este documento define el stack tecnológico oficial de Barber SaaS.

El proyecto será desarrollado con una arquitectura moderna, modular y escalable, priorizando:

- Bajo costo de infraestructura.
- Desarrollo rápido.
- Mantenimiento sencillo.
- Compatibilidad Web + Android + iOS.
- Reutilización de código.
- Desarrollo asistido por IA.
- Posibilidad de escalar en el futuro.

La primera infraestructura utilizará un VPS gratuito de Oracle Cloud.

---

# 2. Decisión principal

Se utilizará **TypeScript como lenguaje principal de desarrollo**.

El objetivo es reducir la cantidad de tecnologías y lenguajes diferentes que el equipo y las herramientas de IA deben manejar.

```text
Web       → TypeScript
Mobile    → TypeScript
Backend   → TypeScript
Database  → PostgreSQL / SQL
```

Esto permite compartir:

- Tipos
- Interfaces
- Validaciones
- Modelos
- Clientes de API
- Utilidades
- Reglas de negocio que sean apropiadas para compartir

entre las diferentes aplicaciones.

---

# 3. Arquitectura general

La plataforma tendrá tres aplicaciones principales:

```text
                         BARBER SAAS
                              │
               ┌──────────────┴──────────────┐
               │                             │
               ▼                             ▼
          WEB APPLICATION              MOBILE APPLICATION
             Next.js                  React Native + Expo
          TypeScript                     TypeScript
               │                             │
               └──────────────┬──────────────┘
                              │
                              │ HTTPS / REST
                              ▼
                         BACKEND API
                            NestJS
                          TypeScript
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
               PostgreSQL          File Storage
                                     │
                                     ▼
                               Local / S3*
```

`*` El almacenamiento S3 será incorporado cuando sea necesario.

---

# 4. Aplicación Web

## Tecnología

- Next.js
- React
- TypeScript
- Tailwind CSS

---

## Next.js

Next.js será utilizado para la aplicación web.

Permitirá desarrollar:

- Panel administrativo.
- Dashboard.
- Gestión de clientes.
- Gestión de servicios.
- Gestión de ventas.
- Caja.
- Configuración del negocio.
- Páginas públicas.
- Landing page.
- Páginas de precios.
- Futuras páginas de reserva.

---

## ¿Por qué Next.js?

Porque permite tener en un mismo ecosistema:

- Aplicación web.
- Rutas.
- Renderizado del lado del servidor cuando sea necesario.
- SEO.
- Páginas públicas.
- Aplicación privada.
- Excelente integración con React y TypeScript.

---

# 5. Aplicación móvil

## Tecnología

- React Native
- Expo
- TypeScript

La aplicación móvil será una aplicación real para:

- Android
- iOS

---

## Expo

Expo será utilizado para simplificar:

- Desarrollo.
- Testing.
- Builds.
- Publicación.
- Notificaciones.
- Integración con funcionalidades nativas.

---

## ¿Por qué React Native?

Permite utilizar React y TypeScript para desarrollar aplicaciones móviles.

Además, permite compartir conocimientos y lógica con la aplicación Web.

No se pretende compartir el 100% de la interfaz entre Web y Mobile.

Se compartirán principalmente:

- Tipos.
- Validaciones.
- Clientes API.
- Modelos.
- Utilidades.
- Lógica reutilizable.

---

# 6. Backend

## Tecnología

- Node.js
- NestJS
- TypeScript

NestJS será responsable de toda la lógica de negocio y de proporcionar la API REST.

---

# 7. Node.js

Node.js será el runtime del backend.

Ventajas:

- Mismo lenguaje que frontend.
- Ecosistema amplio.
- Buen soporte para APIs.
- Excelente integración con TypeScript.
- Desarrollo rápido.
- Gran compatibilidad con herramientas de IA.

---

# 8. NestJS

NestJS será el framework principal del backend.

Se utilizará para:

- REST API.
- Autenticación.
- Autorización.
- Servicios.
- Validación.
- Acceso a base de datos.
- Integraciones externas.

---

# 9. Arquitectura Backend

El backend utilizará un **Monolito Modular**.

No se utilizarán microservicios durante el MVP.

Ejemplo:

```text
backend/

src/

├── auth/
├── tenants/
├── users/
├── customers/
├── services/
├── sales/
├── cash/
├── business/
├── settings/
├── notifications/
└── shared/
```

Cada módulo tendrá responsabilidades claramente definidas.

---

# 10. ¿Por qué Monolito Modular?

Porque el proyecto inicialmente tendrá pocos usuarios y una infraestructura muy pequeña.

Los microservicios agregarían:

- Mayor complejidad.
- Más infraestructura.
- Más despliegues.
- Más monitoreo.
- Más puntos de fallo.
- Mayor costo.

No existe una razón para utilizarlos desde el comienzo.

El monolito modular permitirá desarrollar rápidamente manteniendo separación entre dominios.

---

# 11. Escalabilidad

La arquitectura estará preparada para evolucionar.

La evolución prevista será:

```text
Etapa 1

Oracle VPS

┌───────────────────────┐
│ Nginx                 │
│ Next.js               │
│ NestJS                │
│ PostgreSQL            │
└───────────────────────┘
```

Posteriormente:

```text
Etapa 2

Nginx
  │
  ├── Web
  │
  └── API
       │
       └── PostgreSQL separado
```

Posteriormente:

```text
Etapa 3

Web
 │
 ▼
Load Balancer
 │
 ├── API Instance 1
 ├── API Instance 2
 └── API Instance 3
          │
          ▼
      PostgreSQL
```

Y únicamente cuando exista una necesidad real:

```text
API
 │
 ├── Auth Service
 ├── Sales Service
 ├── Notifications Service
 └── Analytics Service
```

Los microservicios serán una evolución, no una condición inicial.

---

# 12. Base de datos

## PostgreSQL

PostgreSQL será la base de datos principal.

Motivos:

- Open Source.
- Gratuita.
- Robusta.
- Escalable.
- Excelente integración con Node.js.
- Excelente soporte para relaciones.
- Adecuada para aplicaciones SaaS.

---

# 13. ORM

Se utilizará:

**Prisma ORM**

Responsabilidades:

- Acceso a PostgreSQL.
- Definición del schema.
- Migraciones.
- Queries.
- Tipado.

Prisma permitirá que TypeScript conozca los tipos de la base de datos.

---

# 14. Migraciones

Las modificaciones de la base de datos deberán realizarse mediante migraciones.

No se modificarán tablas manualmente en producción.

Cada cambio deberá quedar registrado en el repositorio.

Ejemplo:

```text
prisma/
├── schema.prisma
└── migrations/
    ├── 001_initial/
    ├── 002_customers/
    └── 003_sales/
```

---

# 15. Multi-Tenant

El sistema será Multi-Tenant desde el inicio.

Cada negocio será un Tenant.

Ejemplo:

```text
Tenant
│
├── Users
├── Customers
├── Services
├── Sales
├── Cash Movements
└── Settings
```

Las entidades relacionadas con un negocio deberán estar asociadas a su `tenant_id`.

---

# 16. Autenticación

Se utilizará:

- JWT
- Access Token
- Refresh Token

El backend será responsable de validar:

- Identidad.
- Tenant.
- Rol.
- Permisos.

---

# 17. Autorización

Inicialmente existirán dos roles:

## Owner

Puede:

- Administrar negocio.
- Administrar empleados.
- Administrar servicios.
- Consultar ventas.
- Consultar caja.
- Consultar reportes.

## Employee

Puede:

- Registrar ventas.
- Consultar clientes.
- Consultar servicios.
- Registrar gastos según permisos.

El sistema deberá estar preparado para agregar nuevos roles posteriormente.

---

# 18. Validación

Backend:

- class-validator / class-transformer según las necesidades de NestJS.

Frontend:

- Zod.

La validación importante siempre deberá existir también en backend.

Nunca se confiará únicamente en la validación del frontend.

---

# 19. API

La comunicación entre aplicaciones utilizará:

**REST + JSON + HTTPS**

Ejemplo:

```text
POST /api/v1/auth/login

GET /api/v1/customers

POST /api/v1/customers

GET /api/v1/services

POST /api/v1/sales

GET /api/v1/cash
```

Se utilizará versionado:

```text
/api/v1/
```

Esto permitirá introducir cambios incompatibles posteriormente sin romper clientes antiguos.

---

# 20. Código compartido

Se recomienda utilizar un monorepo.

Estructura propuesta:

```text
barber-saas/

├── apps/
│   ├── web/
│   ├── mobile/
│   └── api/
│
├── packages/
│   ├── types/
│   ├── validation/
│   ├── api-client/
│   └── config/
│
├── docs/
├── prisma/
├── docker/
└── package.json
```

---

# 21. Monorepo

El proyecto utilizará un monorepo para mantener las aplicaciones y paquetes compartidos en un único repositorio.

Se utilizará:

**pnpm**

y posteriormente se podrá utilizar:

**Turborepo**

si el crecimiento del proyecto lo justifica.

No se agregará Turborepo únicamente por moda.

---

# 22. UI Web

La interfaz Web utilizará:

- Tailwind CSS.
- Componentes reutilizables.
- Diseño Mobile First.
- Responsive Design.

La interfaz deberá funcionar correctamente en:

- Teléfono.
- Tablet.
- Laptop.
- Desktop.

---

# 23. UI Mobile

La aplicación móvil utilizará componentes nativos de React Native.

La interfaz no tendrá que ser idéntica a la Web.

Debe respetar las convenciones de cada plataforma.

---

# 24. Estado de la aplicación

Para datos provenientes del backend:

**TanStack Query**

Para estado local:

- React state.
- Context cuando sea necesario.

No se utilizará Redux inicialmente.

Se agregará una solución de estado global únicamente si aparece una necesidad real.

---

# 25. Formularios

Web:

**React Hook Form + Zod**

Mobile:

**React Hook Form + Zod**

Siempre que sea viable se compartirán los schemas de validación.

---

# 26. Storage

Inicialmente:

Almacenamiento local del VPS.

Se utilizará para:

- Logos.
- Imágenes.
- Recursos del negocio.

Posteriormente:

Object Storage compatible con S3.

Ejemplos:

- Cloudflare R2.
- AWS S3.
- Oracle Object Storage.

La aplicación deberá abstraer el proveedor de almacenamiento.

---

# 27. Infraestructura inicial

## Oracle Cloud Free Tier

El MVP será desplegado inicialmente en un VPS gratuito de Oracle Cloud.

Objetivo:

Reducir el costo de infraestructura a prácticamente cero mientras se validan los primeros usuarios.

---

# 28. Docker

Todos los servicios deberán ejecutarse mediante Docker.

Servicios iniciales:

```text
nginx
web
api
postgres
```

---

# 29. Docker Compose

Docker Compose será utilizado para el entorno inicial.

Permitirá ejecutar el proyecto con una configuración reproducible.

Ejemplo:

```text
docker compose up -d
```

---

# 30. Nginx

Nginx será utilizado como reverse proxy.

Responsabilidades:

- HTTPS.
- Routing.
- Servir recursos.
- Proxy hacia API.
- Compresión.

---

# 31. HTTPS

Se utilizará Let's Encrypt para certificados SSL gratuitos.

Toda comunicación en producción deberá utilizar HTTPS.

---

# 32. Dominio

La aplicación podrá utilizar:

```text
www.example.com
```

para la página pública.

```text
app.example.com
```

para la aplicación Web.

```text
api.example.com
```

para la API.

Los dominios reales se definirán posteriormente.

---

# 33. WhatsApp

WhatsApp será una integración futura importante.

Inicialmente:

```text
Reservar por WhatsApp
```

abrirá el chat del negocio.

Posteriormente:

- WhatsApp Business API.
- Recordatorios.
- Confirmación de citas.
- Promociones.
- Automatización.

No se implementará la API oficial de WhatsApp durante el MVP.

---

# 34. Pagos

El MVP solamente registrará:

- Efectivo.
- Transferencia.

No se procesarán pagos inicialmente.

Posteriormente se podrá integrar:

- Stripe.
- Mercado Pago.
- Otros proveedores disponibles en México.

La integración deberá implementarse como módulo independiente.

---

# 35. Offline

La aplicación móvil deberá poder funcionar parcialmente sin conexión.

Las operaciones prioritarias serán:

- Registrar venta.
- Consultar servicios.
- Consultar clientes recientes.
- Registrar gastos.

Los datos pendientes deberán sincronizarse cuando vuelva la conexión.

La sincronización offline será diseñada cuidadosamente para evitar duplicados.

---

# 36. Notificaciones

Inicialmente no se implementarán notificaciones complejas.

Posteriormente:

- Push notifications.
- Recordatorios de citas.
- Alertas de caja.
- Alertas de ventas.
- Promociones.

---

# 37. Testing

Backend:

- Unit Tests.
- Integration Tests.
- E2E Tests para endpoints críticos.

Frontend:

- Unit Tests cuando aporten valor.
- Component Tests.
- E2E para flujos críticos.

Mobile:

- Pruebas en Android.
- Pruebas en iOS.

No se buscará alcanzar una cobertura artificial del 100%.

Se priorizarán los flujos críticos.

---

# 38. CI/CD

GitHub Actions será utilizado posteriormente para automatizar:

- Tests.
- Lint.
- Build.
- Docker image.
- Deploy.

El pipeline inicial deberá mantenerse sencillo.

---

# 39. Calidad de código

Se utilizarán:

- ESLint.
- Prettier.
- TypeScript strict mode.

El proyecto deberá evitar:

- `any` innecesarios.
- Código duplicado.
- Dependencias innecesarias.
- Funciones excesivamente grandes.
- Acoplamiento entre módulos.

---

# 40. Seguridad

Principios iniciales:

- HTTPS obligatorio.
- Passwords hasheadas.
- JWT seguro.
- Validación de inputs.
- Protección contra SQL Injection mediante ORM.
- Rate limiting.
- CORS configurado.
- Secrets mediante variables de entorno.
- No almacenar secretos en Git.
- Separación estricta por tenant.

---

# 41. Variables de entorno

Nunca almacenar credenciales en el repositorio.

Ejemplo:

```text
DATABASE_URL=

JWT_SECRET=

JWT_REFRESH_SECRET=

STORAGE_ACCESS_KEY=

STORAGE_SECRET_KEY=
```

Se proporcionará un:

```text
.env.example
```

pero nunca un `.env` real.

---

# 42. Desarrollo asistido por IA

El proyecto será desarrollado utilizando:

- Claude Code.
- OpenCode.
- ChatGPT.
- Claude Designer.

La IA deberá leer:

```text
docs/PROJECT.md
docs/ARCHITECTURE.md
docs/TECHNOLOGIES.md
docs/DATABASE.md
docs/API.md
docs/UI_UX.md
docs/DECISIONS.md
```

antes de realizar cambios arquitectónicos.

---

# 43. Claude Designer

Claude Designer se utilizará para:

- Mockups.
- Wireframes.
- Flujos.
- Prototipos visuales.
- Diseño de pantallas.

Los mockups no deberán convertirse directamente en código sin revisar previamente:

- UX.
- Arquitectura.
- Componentización.
- Responsive design.
- Accesibilidad.

---

# 44. IA y arquitectura

La IA NO deberá:

- Crear microservicios sin autorización.
- Agregar Redis sin necesidad.
- Agregar Kafka.
- Agregar Kubernetes.
- Cambiar PostgreSQL.
- Cambiar NestJS.
- Cambiar React Native.
- Introducir nuevas tecnologías sin justificación.

La simplicidad es una característica del producto.

---

# 45. Principio de escalabilidad

La aplicación deberá escalar mediante evolución progresiva.

No mediante sobreingeniería inicial.

La estrategia será:

```text
MVP
 ↓
Monolito Modular
 ↓
Separación de infraestructura
 ↓
Escalado horizontal
 ↓
Servicios especializados
```

No:

```text
MVP
 ↓
20 microservicios
 ↓
Kubernetes
 ↓
Complejidad
```

---

# 46. Stack definitivo

| Área | Tecnología |
|---|---|
| Lenguaje principal | TypeScript |
| Web | Next.js + React |
| Mobile | React Native + Expo |
| Backend | Node.js + NestJS |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| API | REST |
| Autenticación | JWT |
| Validación | Zod + class-validator |
| Web UI | Tailwind CSS |
| Estado remoto | TanStack Query |
| Formularios | React Hook Form |
| Monorepo | pnpm |
| Monorepo tooling | Turborepo cuando sea necesario |
| Contenedores | Docker |
| Orquestación inicial | Docker Compose |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt |
| Infraestructura inicial | Oracle Cloud Free Tier |
| CI/CD | GitHub Actions |
| Diseño | Claude Designer |
| Desarrollo IA | Claude Code + OpenCode + ChatGPT |

---

# 47. Decisión final

El stack oficial del proyecto será:

```text
                    ┌─────────────────────┐
                    │       WEB           │
                    │ Next.js + React     │
                    │ TypeScript          │
                    └──────────┬──────────┘
                               │
                               │
                    ┌──────────▼──────────┐
                    │       MOBILE        │
                    │ React Native + Expo │
                    │ TypeScript          │
                    └──────────┬──────────┘
                               │
                               │ HTTPS / REST
                               │
                    ┌──────────▼──────────┐
                    │       BACKEND       │
                    │ NestJS + Node.js    │
                    │ TypeScript          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Oracle Cloud VPS  │
                    │       Docker        │
                    └─────────────────────┘
```

Este stack permite comenzar con una infraestructura extremadamente económica y crecer progresivamente sin cambiar de ecosistema.

La prioridad inicial será construir un MVP pequeño, estable y fácil de utilizar antes de incorporar funcionalidades avanzadas.