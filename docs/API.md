# API

Todas las rutas están versionadas bajo `/api/v1`, según `CLAUDE.md` §14 y `docs/TECHNOLOGIES.md` §19.

## Auth

POST /api/v1/auth/register

&nbsp;&nbsp;Crea el tenant (negocio) y su primer usuario (`owner`) en una sola transacción. No estaba en la versión original de este documento porque `docs/PROJECT.md` v0.1 no especificaba cómo se creaba el primer negocio/usuario; se añadió al implementar Fase 1 para que el flujo de login descrito en `docs/PROJECT.md` sea posible. Devuelve `accessToken` + `refreshToken` (login automático tras registrarse).

POST /api/v1/auth/login

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

## Servicios

Mismo esquema de permisos que Clientes: GET para ambos roles, POST/PUT/DELETE solo `owner`.

GET /api/v1/services

POST /api/v1/services

PUT /api/v1/services/{id}

DELETE /api/v1/services/{id}

---

## Ventas

POST /api/v1/sales

&nbsp;&nbsp;Disponible para `owner` y `employee` (es el flujo "Registrar venta" del día a día). Body: `{ customerId?, serviceIds: string[], paymentMethod: "cash" | "transfer" }`. El `total` y el precio de cada item se calculan en el servidor a partir del precio actual de cada servicio — nunca se acepta un total enviado por el cliente.

GET /api/v1/sales

&nbsp;&nbsp;Solo `owner` (`docs/TECHNOLOGIES.md` §17: "Consultar ventas" está listado solo para Owner). Acepta `?range=today|week|month` para los filtros de Historial de `docs/PROJECT.md`; sin el parámetro devuelve todas las ventas del tenant.

GET /api/v1/sales/{id}

&nbsp;&nbsp;Solo `owner`.

---

## Caja

GET /api/v1/cash

&nbsp;&nbsp;Solo `owner`. Acepta `?range=today|week|month` (default `today`). Devuelve `{ range, income, expense, balance, movements, closedAt }`, donde `income` = ventas cobradas en efectivo + movimientos manuales de tipo `income`, `expense` = movimientos manuales de tipo `expense`, y `balance = income - expense`. Las ventas por transferencia no afectan la caja física. `closedAt` solo se calcula para `range=today` (un corte de caja es por día calendario); en `week`/`month` siempre es `null`.

POST /api/v1/cash/movement

&nbsp;&nbsp;Disponible para `owner` y `employee`. Body: `{ type: "income" | "expense", amount, description? }`.

POST /api/v1/cash/close

&nbsp;&nbsp;Solo `owner`. Corte de caja del día: guarda un snapshot inmutable (`income`, `expense`, `balance` del día al momento de cerrar, quién cerró). No bloquea nuevas ventas ni movimientos — es un registro de auditoría, no un lock. Devuelve 409 si la caja de hoy ya fue cerrada.

---

## Configuración

GET /api/v1/settings

&nbsp;&nbsp;Disponible para `owner` y `employee` (lo usa el sidebar de toda la app). Devuelve `{ businessName, logo, primaryColor, secondaryColor, phone, address }`. `businessName` viene de `tenants.name` (existe desde Fase 1); el resto de `business_settings`, que es 1:1 con el tenant pero no se crea automáticamente al registrarse — antes de la primera edición, todos esos campos son `null`.

PUT /api/v1/settings

&nbsp;&nbsp;Solo `owner`. Body: todos los campos de arriba, opcionales (se actualiza solo lo que se envía). Hace upsert de `business_settings` la primera vez que se edita.
