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

---

## ADR-009

Las suscripciones se gestionan a mano por el dueño de la plataforma (efectivo/transferencia fuera de la app), no con una pasarela de pagos. Para eso existe un panel de SuperAdmin (`/superadmin`), completamente separado del resto del sistema: modelo (`SuperAdmin`, no un `User` de ningún tenant), autenticación (JWT propio, con sus propios secretos y su propio guard/estrategia de Passport) y frontend (rutas, storage de tokens y cliente HTTP aparte).

Motivo:

CLAUDE.md §27/§29 excluye pagos con tarjeta del MVP y exige justificar cualquier costo de infraestructura nuevo; Stripe/Mercado Pago quedan para v1.0 (`docs/ROADMAP.md`). Mientras tanto, alguien tiene que poder activar/suspender negocios sin tocar la base de datos a mano. Un SuperAdmin no puede modelarse como un `User` más porque `tenantId` es obligatorio en ese modelo — y aunque pudiera, mezclar sus permisos con el RBAC por tenant (`Role.owner`/`Role.employee`) arriesgaría accidentalmente exponer datos de un negocio a otro, justo lo que CLAUDE.md §5 prohíbe. La separación completa (JWT, guard, rutas, storage de tokens) hace que ese riesgo sea estructuralmente imposible, no solo una regla de permisos que alguien podría romper por error.

Un negocio suspendido bloquea el login de todos sus usuarios reutilizando el mecanismo de `tokenVersion` que ya existía para dar de baja empleados — nada nuevo que mantener ahí.

Estado:

El SuperAdmin nunca ve clientes, ventas, turnos, caja ni inventario de ningún negocio — solo nombre, contacto del dueño, y estado/historial de la suscripción. Si en el futuro se agrega un procesador de pagos (Stripe, v1.0), este panel probablemente se mantiene para los negocios que sigan pagando por fuera.

---

## ADR-010

Producción corre en un único VPS de Hetzner Cloud, no en Oracle Cloud Free Tier (el plan original de `docs/ARCHITECTURE.md`) ni en una combinación de Vercel + Supabase + Fly.io.

Motivo:

Se evaluaron las tres alternativas gratuitas/casi-gratuitas antes de decidir:

- **Oracle Cloud Free Tier**: gratis de por vida, pero el alta es notoriamente conflictiva (verificación estricta de tarjeta, cuentas suspendidas sin aviso, "sin capacidad disponible" recurrente en la capa gratuita según reportes de usuarios) — inaceptable para la infraestructura de un negocio real que depende de que la app esté arriba.
- **Vercel (Hobby) + Supabase + Fly.io**: el plan gratuito de Vercel prohíbe explícitamente uso comercial ("cualquier deployment usado con fines de lucro", lo cual describe exactamente a este SaaS) y Vercel puede desactivar el proyecto sin aviso por incumplirlo — haría falta el plan Pro (20 USD/mes). Fly.io ya no tiene capa gratuita desde fines de 2024. Supabase gratis pausa el proyecto tras una semana sin actividad en la base. Sumando todo, esta combinación termina costando más que un VPS y con más piezas para mantener.
- **Un VPS de Hetzner** (~5 USD/mes): sin restricciones de uso comercial, sin capas que se pausan solas, un solo lugar para todo (Docker Compose + Nginx + Postgres, igual al esquema ya documentado en `docs/ARCHITECTURE.md`), y más barato que la alternativa "gratuita".

CLAUDE.md §26/§27 pide mantener la infraestructura simple y de bajo costo, no necesariamente gratis a cualquier precio — un VPS confiable de 5 USD/mes cumple mejor ese objetivo que apilar tres servicios gratuitos con riesgos de downtime o de que te corten el servicio.

Estado:

Runbook completo en `docs/DEPLOYMENT.md`. La imagen de producción de la API usa `pnpm deploy` (poda devDependencies) — importante: el paso de `prisma generate` que corre automáticamente durante ese deploy no queda bien (genera un cliente incompleto, sin los enums del schema), así que se regenera explícitamente después, ya en el directorio final, antes de copiarlo a la imagen runtime. El frontend usa `output: "standalone"` de Next.js, con `outputFileTracingRoot` apuntando a la raíz del monorepo (si no, el file tracing no ve los paquetes hermanos `@barber/types`/`@barber/api-client`).

---

## ADR-011

Recordatorios de turno y recibos de pago se mandan por WhatsApp usando la API oficial de Meta (Cloud API), con credenciales propias por tenant (`WhatsAppConnection`: `phoneNumberId`, `wabaId`, `accessToken`), no una automatización no oficial sobre WhatsApp Web ni un proveedor externo (Twilio, etc.).

Motivo:

Cada barbería ya tiene su propio número de WhatsApp al que sus clientes le escriben — igual que la suscripción (ADR-009), esto debe quedar aislado por tenant (CLAUDE.md §5), así que la conexión se guarda una por negocio en vez de una sola credencial de plataforma. La alternativa gratuita (automatizar WhatsApp Web con un navegador headless) viola los términos de servicio de Meta y arriesga que le bloqueen el número al dueño — inaceptable para un negocio real. La API oficial tiene nivel gratuito/muy económico al volumen de una barbería chica (CLAUDE.md §27), sin agregar infraestructura propia: los mensajes salen vía HTTP a la Graph API de Meta, sin colas ni brokers.

El envío nunca puede bloquear ni hacer fallar la operación principal (agendar un turno, cobrar una venta): tanto el cron de recordatorios como el envío de recibos capturan sus propios errores y solo loguean, nunca propagan la excepción hacia arriba.

La imagen del recibo se genera armando un SVG a mano y rasterizándolo con `sharp` — no Puppeteer ni `node-canvas` — para no sumar un navegador headless ni dependencias nativas de Cairo a la imagen de Docker (CLAUDE.md §8/§26).

La verificación de la firma de cada webhook entrante (HMAC-SHA256 sobre el body crudo, con `WHATSAPP_APP_SECRET`) es obligatoria: sin ella, cualquiera que conozca la URL del webhook podría inyectar eventos falsos.

Estado:

Primera etapa: solo recordatorios (2hs antes del turno, vía `@nestjs/schedule`, cada 15 minutos) y recibos de pago en foto al cobrar una venta. Reservar turnos escribiendo por WhatsApp queda deliberadamente afuera de esta etapa — requiere procesar texto libre (o flujos de botones/listas) del lado del webhook, que hoy solo verifica la firma y loguea el evento entrante. El dueño debe crear su propia app de WhatsApp Business en Meta, verificar su número y cargar el `phoneNumberId`/`wabaId`/`accessToken` en Configuración; también debe dar de alta y esperar la aprobación de Meta para la plantilla `recordatorio_turno`.
