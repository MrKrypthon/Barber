# API

Todas las rutas están versionadas bajo `/api/v1`, según `CLAUDE.md` §14 y `docs/TECHNOLOGIES.md` §19.

## Auth

POST /api/v1/auth/register

&nbsp;&nbsp;Crea el tenant (negocio) y su primer usuario (`owner`) en una sola transacción. No estaba en la versión original de este documento porque `docs/PROJECT.md` v0.1 no especificaba cómo se creaba el primer negocio/usuario; se añadió al implementar Fase 1 para que el flujo de login descrito en `docs/PROJECT.md` sea posible. Devuelve `accessToken` + `refreshToken` (login automático tras registrarse).

POST /api/v1/auth/login

&nbsp;&nbsp;403 si el negocio del usuario tiene la suscripción suspendida (`subscriptionStatus`, gestión manual desde el panel de SuperAdmin — ADR-009, `docs/DECISIONS.md`), aunque las credenciales sean correctas.

POST /api/v1/auth/refresh

&nbsp;&nbsp;Intercambia un `refreshToken` vigente por un nuevo par de tokens. Necesario porque `docs/TECHNOLOGIES.md` §16 exige estrategia access + refresh token, pero esta ruta no estaba listada originalmente.

POST /api/v1/auth/logout

&nbsp;&nbsp;Requiere `accessToken` válido. Invalida todos los refresh tokens emitidos previamente (incrementa `token_version` del usuario).

GET /api/v1/auth/me

&nbsp;&nbsp;Requiere `accessToken` válido.

---

## Clientes

Todas las rutas requieren `accessToken`. GET disponible para `owner` y `employee`; POST/PUT/DELETE solo `owner` (`docs/TECHNOLOGIES.md` §17).

GET /api/v1/customers

POST /api/v1/customers

PUT /api/v1/customers/{id}

DELETE /api/v1/customers/{id}

---

## Empleados

Todas las rutas exclusivas de `owner` (`docs/PROJECT.md` — el rol `employee` no tiene esta capacidad). No hay envío de invitación por correo: el dueño define nombre, correo y contraseña inicial del empleado directamente.

GET /api/v1/employees

&nbsp;&nbsp;Lista solo usuarios con `role = employee` del tenant (no incluye al propio owner).

GET /api/v1/employees/assignable

&nbsp;&nbsp;Excepción a "todas las rutas exclusivas de owner": disponible para `owner` y `employee`. Devuelve `{ id, name }[]` del owner + empleados activos del tenant (a diferencia de `GET /employees`, sí incluye al owner), para el selector "¿quién atendió esto?" al agendar un turno o cobrar una venta.

POST /api/v1/employees

&nbsp;&nbsp;Body: `{ name, email, password }`. Crea un usuario con `role = employee`. 409 si el correo ya existe (el email es único a nivel global, sin importar si la cuenta existente está dada de baja).

PUT /api/v1/employees/{id}

&nbsp;&nbsp;Body: `{ name?, email?, password? }`. `password` es opcional — se manda solo cuando el dueño quiere resetearla.

DELETE /api/v1/employees/{id}

&nbsp;&nbsp;Baja lógica (`deleted_at`, igual que `customers`/`services`/`appointments`): el empleado deja de poder loguearse o refrescar su sesión, pero sus ventas y turnos históricos no se tocan. También invalida cualquier refresh token ya emitido (mismo mecanismo que logout).

---

## Servicios

Mismo esquema de permisos que Clientes: GET para ambos roles, POST/PUT/DELETE solo `owner`.

GET /api/v1/services

POST /api/v1/services

&nbsp;&nbsp;`commissionPercent` (0-100, opcional) define qué % se lleva de comisión quien realice el servicio; sin configurar, el servicio no genera comisión. Se usa en el Panel del administrador para calcular comisiones por empleado sobre sus ventas del mes.

PUT /api/v1/services/{id}

&nbsp;&nbsp;`commissionPercent: null` borra una comisión ya configurada (distinto de omitir el campo, que deja el valor actual sin tocar).

DELETE /api/v1/services/{id}

---

## Ventas

POST /api/v1/sales

&nbsp;&nbsp;Disponible para `owner` y `employee` (es el flujo "Registrar venta" del día a día). Body: `{ customerId?, serviceIds: string[], paymentMethod: "cash" | "transfer", employeeId? }`. El `total` y el precio de cada item se calculan en el servidor a partir del precio actual de cada servicio — nunca se acepta un total enviado por el cliente. Si se omite `employeeId`, la venta queda a nombre de quien la registra; asignarla a otro empleado (para el caso del dueño que también es barbero/estilista) es exclusivo del `owner` — un `employee` que lo intente recibe 403.

GET /api/v1/sales

&nbsp;&nbsp;Solo `owner` (`docs/TECHNOLOGIES.md` §17: "Consultar ventas" está listado solo para Owner). Acepta `?range=today|week|month` para los filtros de Historial de `docs/PROJECT.md`; sin parámetros devuelve todas las ventas del tenant. `?since=YYYY-MM-DD` es una alternativa a `range` — cota inferior abierta ("desde esa fecha hasta ahora") para pedir una ventana que no coincide con ninguno de los buckets fijos, como usa el Panel del administrador para no traer todo el historial.

GET /api/v1/sales/{id}

&nbsp;&nbsp;Solo `owner`.

---

## Caja

"Movimiento" (el array `movements` que devuelven `/cash`, `/cash/closings/{date}` y `/cash/report`) no es solo lo cargado a mano: cada venta cobrada en efectivo también aparece como uno, con `source: "sale"`, `customerName` y `serviceNames` (qué servicio(s) y a quién) además de `amount`/`createdAt`. Un movimiento cargado a mano trae `source: "manual"`, `customerName: null`, `serviceNames: []`, y su `description` tal cual la escribió quien lo cargó. Las ventas por transferencia nunca aparecen acá — no mueven la caja física.

GET /api/v1/cash

&nbsp;&nbsp;Solo `owner`. Acepta `?range=today|week|month` (default `today`). Devuelve `{ range, income, expense, balance, movements, closedAt }`, donde `income` = ventas cobradas en efectivo + movimientos manuales de tipo `income`, `expense` = movimientos manuales de tipo `expense`, y `balance = income - expense`. Las ventas por transferencia no afectan la caja física. `closedAt` solo se calcula para `range=today` (un corte de caja es por día calendario); en `week`/`month` siempre es `null`.

POST /api/v1/cash/movement

&nbsp;&nbsp;Disponible para `owner` y `employee`. Body: `{ type: "income" | "expense", amount, description? }`.

POST /api/v1/cash/close

&nbsp;&nbsp;Solo `owner`. Corte de caja del día: guarda un snapshot inmutable (`income`, `expense`, `balance` del día al momento de cerrar, quién cerró). No bloquea nuevas ventas ni movimientos — es un registro de auditoría, no un lock. Devuelve 409 si la caja de hoy ya fue cerrada.

GET /api/v1/cash/closings

&nbsp;&nbsp;Solo `owner`. Lista todos los cortes ya hechos del tenant (sin movimientos, solo los totales guardados), ordenados por fecha descendente — alimenta el historial para poder volver a exportar el PDF de un día anterior.

GET /api/v1/cash/closings/{date}

&nbsp;&nbsp;Solo `owner`. `date` en formato `YYYY-MM-DD`. Devuelve el corte de ese día calendario + sus movimientos (`{ ...closing, movements }`). Los totales son el snapshot guardado al cerrar, no se recalculan. 404 si ese día no se cerró la caja, 400 si `date` no tiene el formato esperado.

GET /api/v1/cash/report

&nbsp;&nbsp;Solo `owner`. Query: `from`, `to` (ambos `YYYY-MM-DD`, requeridos). Reporte de un rango arbitrario (semana/quincena/mes/personalizado, el frontend arma los presets) para exportar a PDF con desglose día por día. A diferencia de `/cash/closings/{date}`, no depende de que cada día se haya cerrado: calcula en vivo a partir de ventas en efectivo + movimientos manuales, mismo criterio que `GET /cash?range=week|month`. Devuelve `{ from, to, income, expense, balance, days }`, donde `days` trae un elemento por cada día del rango (incluso los que no tuvieron actividad, en cero) con sus propios `income`/`expense`/`balance`/`movements`. 400 si `from` es posterior a `to`, si el formato de alguna fecha es inválido, o si el rango supera 366 días.

---

## Inventario

Inventario v0.3 (`docs/ROADMAP.md`): solo productos de reventa, sin vínculo automático con Ventas ni Servicios — el stock se mueve exclusivamente a mano. Mismo esquema de permisos que Servicios para el catálogo (GET para ambos roles, POST/PUT/DELETE solo `owner`) y que Caja para los movimientos (POST disponible para `owner` y `employee`).

GET /api/v1/products

&nbsp;&nbsp;No existe un `GET /products/{id}`: el detalle de un producto se resuelve en el frontend a partir de esta misma lista (mismo criterio que Servicios).

POST /api/v1/products

&nbsp;&nbsp;Body: `{ name, photo?, stock?, minStock? }`. `photo` es un data URI (base64) ya redimensionado en el cliente, mismo criterio que `settings.logo` (ADR-008, `docs/DECISIONS.md`). `stock` es el stock inicial (default 0); a partir de ahí solo cambia vía `POST /products/{id}/movements`.

PUT /api/v1/products/{id}

&nbsp;&nbsp;Body: `{ name?, photo?, minStock? }`. No acepta `stock` (ver arriba). `minStock: null` borra un mínimo ya configurado (distinto de omitir el campo, que deja el valor actual sin tocar — mismo criterio que `services.commissionPercent`).

DELETE /api/v1/products/{id}

&nbsp;&nbsp;Baja lógica (`deletedAt`, igual que Clientes/Servicios).

GET /api/v1/products/{id}/movements

&nbsp;&nbsp;Historial de movimientos del producto, del más reciente al más viejo.

POST /api/v1/products/{id}/movements

&nbsp;&nbsp;Body: `{ type: "entry" | "exit", quantity, description? }`. Actualiza `products.stock` en la misma transacción que crea el movimiento. Devuelve 400 si una salida dejaría el stock en negativo. El stepper +/- del grid de Inventario en el frontend abre el mismo modal "Registrar movimiento" que el detalle del producto (precargado con cantidad 1 y el tipo sugerido por el botón), en vez de llamar a esta ruta directo — no hay un endpoint separado para ajustes rápidos.

---

## Configuración

GET /api/v1/settings

&nbsp;&nbsp;Disponible para `owner` y `employee` (lo usa el sidebar de toda la app). Devuelve `{ businessName, logo, primaryColor, secondaryColor, backgroundColor, phone, address, scheduleDays, scheduleOpen, scheduleClose, remindersEnabled }`. `businessName` viene de `tenants.name` (existe desde Fase 1); el resto de `business_settings`, que es 1:1 con el tenant pero no se crea automáticamente al registrarse — antes de la primera edición, todos esos campos son `null` salvo `remindersEnabled`, que por defecto es `true` (ADR-011). El frontend aplica `primaryColor`/`secondaryColor`/`backgroundColor` como variables CSS en tiempo real (`ThemeVars`, `apps/web/src/components/theme-vars.tsx`); si son `null` usa los valores por defecto de `globals.css`.

PUT /api/v1/settings

&nbsp;&nbsp;Solo `owner`. Body: todos los campos de arriba, opcionales (se actualiza solo lo que se envía). Hace upsert de `business_settings` la primera vez que se edita. `remindersEnabled` controla únicamente `RemindersCron` (recordatorios de turno) — no afecta el envío de recibos de pago, que sigue mandándose mientras haya conexión de WhatsApp.

---

## WhatsApp

Conexión con la API oficial de WhatsApp Business (Meta Cloud API), para mandar recordatorios de turno y recibos de pago en foto (ADR-011, `docs/DECISIONS.md`). Rutas de conexión disponibles solo para `owner`.

GET /api/v1/whatsapp/connection

&nbsp;&nbsp;Devuelve `{ connected, phoneNumberId, wabaId, accessTokenPreview }`. `accessTokenPreview` nunca es el token completo — solo los últimos 4 caracteres, con "••••" adelante. Sin conexión cargada, devuelve `{ connected: false, phoneNumberId: null, wabaId: null, accessTokenPreview: null }`.

PUT /api/v1/whatsapp/connection

&nbsp;&nbsp;Body: `{ phoneNumberId, wabaId, accessToken }`, los tres obligatorios. Hace upsert — pisa la conexión anterior si ya existía una.

DELETE /api/v1/whatsapp/connection

&nbsp;&nbsp;Borra la conexión del tenant. A partir de acá no se mandan más recordatorios ni recibos hasta que se vuelva a conectar.

GET /api/v1/whatsapp/webhook

&nbsp;&nbsp;Handshake de verificación de Meta al dar de alta el webhook — si `hub.verify_token` coincide con `WHATSAPP_VERIFY_TOKEN`, devuelve `hub.challenge` tal cual (200); si no, 403. No requiere autenticación (lo llama Meta, no el frontend).

POST /api/v1/whatsapp/webhook

&nbsp;&nbsp;Recibe eventos entrantes (mensajes, estados de entrega). Verifica la firma HMAC-SHA256 del body (`X-Hub-Signature-256` contra `WHATSAPP_APP_SECRET`) antes de procesar nada; responde 200 siempre (lo exige Meta) aunque la firma sea inválida, para no generar reintentos. Por ahora solo loguea los eventos — procesar reservas por mensaje de texto queda para una segunda etapa (ADR-011).

---

## Agenda

Agenda manual (v0.2, `docs/ROADMAP.md`): el empleado registra los turnos recibidos por WhatsApp (`docs/PROJECT.md`, "Segunda etapa"). No hay reserva por parte del cliente, por lo que todas las rutas están disponibles para `owner` y `employee` sin restricción de rol.

GET /api/v1/appointments

&nbsp;&nbsp;Acepta `?date=<ISO date>&range=today|week`; sin `range` devuelve todos los turnos del tenant (mismo criterio que `/sales` y `/customers`). `date` es la fecha de referencia para navegar la agenda a cualquier día/semana, no solo la actual. `?since=YYYY-MM-DD` es una alternativa a `range`/`date`, mismo criterio que en `/sales`.

POST /api/v1/appointments

&nbsp;&nbsp;Body: `{ customerId, serviceId, employeeId?, startAt }`. Si se omite `employeeId`, el turno queda asignado al usuario autenticado. `durationMinutes` se copia del servicio en el momento de crear el turno (mismo criterio que `sale_items.price` con `services.price`): un cambio futuro en la duración del servicio no mueve turnos ya agendados. Responde 400 si el servicio no tiene duración configurada, y 409 si el empleado ya tiene un turno que se solapa con el horario solicitado.

PUT /api/v1/appointments/{id}

&nbsp;&nbsp;Reagenda o reasigna un turno. Si se envía `serviceId`, `durationMinutes` se recalcula a partir del nuevo servicio. Mismas validaciones de solapamiento y duración configurada que en la creación.

DELETE /api/v1/appointments/{id}

&nbsp;&nbsp;Cancela el turno (soft delete vía `deletedAt`, igual que Clientes/Servicios) — no se borra físicamente.

---

## Panel de SuperAdmin

Gestión manual de suscripciones (ADR-009, `docs/DECISIONS.md`) — completamente separado del resto de la API. Ningún endpoint de acá abajo acepta ni devuelve nada de las relaciones de negocio de un tenant (clientes, ventas, turnos, caja, inventario): solo nombre del negocio, contacto del dueño y estado de la suscripción.

POST /api/v1/superadmin/auth/login

&nbsp;&nbsp;Sin registro propio — la única cuenta se crea con `pnpm --filter @barber/api seed:superadmin`. Devuelve `accessToken`/`refreshToken` firmados con `SUPERADMIN_JWT_SECRET` (nunca `JWT_SECRET`): un token de negocio no sirve acá, ni viceversa.

POST /api/v1/superadmin/auth/refresh

POST /api/v1/superadmin/auth/logout

GET /api/v1/superadmin/auth/me

GET /api/v1/superadmin/tenants

&nbsp;&nbsp;Lista todos los negocios: `{ id, name, ownerName, ownerEmail, createdAt, subscriptionStatus, subscriptionPaidUntil }`. `ownerName`/`ownerEmail` vienen del primer `user` con `role=owner` del tenant.

GET /api/v1/superadmin/tenants/{id}

&nbsp;&nbsp;Detalle de un negocio + su historial de pagos (`{ ...tenant, payments }`).

POST /api/v1/superadmin/tenants/{id}/suspend

&nbsp;&nbsp;Pone `subscriptionStatus=suspended` e invalida de una las sesiones ya abiertas de todos los usuarios del tenant (incrementa `tokenVersion` de cada uno, mismo mecanismo que dar de baja a un empleado). Los intentos de login nuevos quedan bloqueados por `AuthService.login` mientras siga suspendido.

POST /api/v1/superadmin/tenants/{id}/activate

&nbsp;&nbsp;Reactivación manual sin pago de por medio (ej. cortesía). No toca `tokenVersion` de los usuarios — no hace falta, ellos nunca perdieron su sesión si ya estaba abierta.

POST /api/v1/superadmin/tenants/{id}/payments

&nbsp;&nbsp;Body: `{ amount, method: "cash" | "transfer", paidUntil: "YYYY-MM-DD", note? }`. Crea el registro de pago, actualiza `subscriptionPaidUntil` y reactiva el tenant (`subscriptionStatus=active`) — es el flujo normal; `activate` de arriba es solo para el caso sin pago.
