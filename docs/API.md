# API

Todas las rutas están versionadas bajo `/api/v1`, según `CLAUDE.md` §14 y `docs/TECHNOLOGIES.md` §19.

## Auth

POST /api/v1/auth/login

POST /api/v1/auth/logout

GET /api/v1/auth/me

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
