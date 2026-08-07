# Modelo de Datos

## tenants

- id
- name
- created_at

---

## users

- id
- tenant_id
- name
- email
- password
- role

---

## customers

- id
- tenant_id
- name
- phone
- notes

---

## services

- id
- tenant_id
- name
- price
- active

---

## sales

- id
- tenant_id
- customer_id
- employee_id
- payment_method
- total
- created_at

---

## sale_items

- id
- sale_id
- service_id
- price

---

## cash_movements

- id
- tenant_id
- type
- amount
- description

---

## business_settings

- tenant_id
- logo
- primary_color
- secondary_color
- phone
- address
