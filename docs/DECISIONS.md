# Architecture Decision Records

---

## ADR-001

El proyecto será un Monolito Modular.

Motivo:

Simplicidad.

---

## ADR-002

El frontend será una PWA.

Motivo:

No depender de App Store.

---

## ADR-003

Todo el sistema será Multi Tenant.

Motivo:

Reducir costos.

---

## ADR-004

No se utilizarán Microservicios.

Motivo:

No agregan valor al MVP.

---

## ADR-005

WhatsApp será el principal medio de reservas.

El sistema no intentará reemplazarlo.

---

## ADR-006

El stack técnico se migra a TypeScript full-stack: Next.js (web), NestJS (backend), Prisma (ORM), PostgreSQL. Reemplaza la decisión original de React + Vite (frontend) y Java 21 + Spring Boot (backend).

Motivo:

Reducir el número de lenguajes y ecosistemas que el equipo y las herramientas de desarrollo asistido por IA deben manejar. Un único lenguaje (TypeScript) permite compartir tipos, validaciones y clientes de API entre web, mobile y backend.

Estado:

Reemplaza la arquitectura descrita originalmente en `docs/PROJECT.md` v0.1 y `docs/ARCHITECTURE.md`. Ambos documentos fueron actualizados para reflejar esta decisión.

---

## ADR-007

El MVP será web-only: Next.js con capacidades PWA. La aplicación móvil nativa (React Native + Expo) descrita en `docs/TECHNOLOGIES.md` se implementará después de validar el MVP, no durante él.

Motivo:

Reducir el alcance del MVP a lo estrictamente necesario para validar el producto con las primeras barberías, evitando construir dos frontends en paralelo. Es consistente con `docs/ROADMAP.md`, que ubica "Aplicaciones móviles" en v1.0.

Estado:

ADR-002 (frontend PWA) permanece vigente: se cumple mediante Next.js en lugar de Vite. El monorepo reserva `apps/mobile/` desde el inicio para no requerir una reestructuración cuando se implemente.

---

## ADR-008

El logo/foto de perfil del negocio se guarda como data URI (base64) en `business_settings.logo`, no como archivo en disco ni en un servicio externo (S3, Cloudinary, etc.).

Motivo:

El MVP corre en un único VPS sin infraestructura de almacenamiento de archivos (`docs/ARCHITECTURE.md`), y agregar un volumen persistente + servido de estáticos sería infraestructura adicional para un caso de uso simple (una imagen pequeña por negocio). El cliente redimensiona/comprime la imagen a un cuadrado antes de subirla, así el tamaño guardado en la fila se mantiene acotado (decenas de KB).

Estado:

Si en el futuro el tamaño de las imágenes se vuelve un problema (por ejemplo, al agregar fotos de servicios o galería), reevaluar con almacenamiento de archivos dedicado.
