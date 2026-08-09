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

GET /api/v1/customers

POST /api/v1/customers

PUT /api/v1/customers/{id}

DELETE /api/v1/customers/{id}

---

## Servicios

GET /api/v1/services

POST /api/v1/services

PUT /api/v1/services/{id}

DELETE /api/v1/services/{id}

---

## Ventas

POST /api/v1/sales

GET /api/v1/sales

GET /api/v1/sales/{id}

---

## Caja

GET /api/v1/cash

POST /api/v1/cash/movement

---

## Configuración

GET /api/v1/settings

PUT /api/v1/settings
