# Modelo de Datos

Convenciones generales (ver `CLAUDE.md` §15):

- `id` es UUID en todas las tablas, salvo que se documente lo contrario.
- `created_at` existe en toda tabla.
- `updated_at` existe en toda tabla cuyos registros se puedan editar después de creados.
- `sales`, `sale_items` y `cash_movements` son registros de auditoría/financieros: no se editan una vez creados, por lo que no llevan `updated_at`. Correcciones se hacen mediante nuevos movimientos, nunca sobrescribiendo.
- `deleted_at` (soft delete) se usa en `customers` y `services`, porque pueden estar referenciados por ventas históricas y no deben desaparecer físicamente de la base de datos.

---

## tenants

- id (uuid)
- name
- created_at
- updated_at

---

## users

- id (uuid)
- tenant_id
- name
- email (único globalmente — un usuario pertenece a un solo tenant, el login no pide elegir negocio)
- password (hash)
- role (`owner` | `employee`)
- token_version (entero, default 0 — se incrementa en logout para invalidar refresh tokens ya emitidos; detalle de implementación del flujo de auth, no un campo de negocio)
- created_at
- updated_at

---

## customers

- id (uuid)
- tenant_id
- name
- phone
- notes
- created_at
- updated_at
- deleted_at (soft delete, nullable)

---

## services

- id (uuid)
- tenant_id
- name
- price
- active
- created_at
- updated_at
- deleted_at (soft delete, nullable)

---

## sales

- id (uuid)
- tenant_id
- customer_id (nullable — permite "cliente ocasional")
- employee_id
- payment_method (`cash` | `transfer`)
- total
- created_at

---

## sale_items

- id (uuid)
- sale_id
- service_id
- price (precio del servicio al momento de la venta — independiente de cambios futuros en `services.price`)
- created_at

---

## cash_movements

Movimientos manuales de caja (aportes, gastos). No incluye un registro por cada venta: la "caja actual" (`GET /api/v1/cash`) se calcula combinando `sales` (solo `payment_method = cash`) con estos movimientos, para no duplicar el mismo ingreso en dos tablas. Ver `docs/API.md` (Caja).

- id (uuid)
- tenant_id
- type (`income` | `expense`)
- amount
- description
- created_at

---

## business_settings

- tenant_id (uuid, PK/FK a `tenants`)
- logo
- primary_color
- secondary_color
- phone
- address
- created_at
- updated_at
