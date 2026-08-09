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
- email
- password (hash)
- role (`owner` | `employee`)
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
- price
- created_at

---

## cash_movements

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
