# Despliegue a producción

Runbook para poner la app en un VPS real. Arquitectura: un solo servidor, Docker Compose, Nginx como único punto de entrada (ADR-010, `docs/DECISIONS.md`).

```text
Internet
   ↓
Nginx (80/443, Let's Encrypt)
   ↓           ↓
 Web (3000)   API (3001)
              ↓
          PostgreSQL
```

---

## 1. Provisionar el VPS

Proveedor recomendado: [Hetzner Cloud](https://www.hetzner.com/cloud/) (ADR-010). Plan `CX22` (2 vCPU, 4GB RAM) alcanza sobra para el tamaño de negocio que maneja la app.

- Crear el servidor con Ubuntu 24.04 LTS.
- Anotar la IP pública.
- Instalar Docker Engine + el plugin de Compose ([guía oficial](https://docs.docker.com/engine/install/ubuntu/)).

## 2. Apuntar el dominio

En el proveedor de DNS del negocio, crear un registro `A` apuntando el dominio (o subdominio, ej. `app.tubarberia.com`) a la IP del VPS. Esperar a que propague (`dig +short tudominio.com` debe devolver esa IP) antes de seguir — certbot necesita que el dominio ya resuelva.

## 3. Clonar el repo y configurar `.env`

```bash
git clone https://github.com/MrKrypthon/Barber.git
cd Barber
cp .env.example .env
```

Completar `.env`:

- `POSTGRES_PASSWORD`: una contraseña real, no la de desarrollo.
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SUPERADMIN_JWT_SECRET`, `SUPERADMIN_JWT_REFRESH_SECRET`: generar cuatro valores distintos con `openssl rand -hex 32`.
- `DATABASE_URL`: `postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@postgres:5432/<POSTGRES_DB>?schema=public` — el host es `postgres` (nombre del servicio en Compose), no `localhost`.
- `CORS_ORIGIN`: `https://tudominio.com`.
- `DOMAIN`: `tudominio.com` (sin `https://` ni barra final).
- `CERTBOT_EMAIL`: un email real, Let's Encrypt lo usa para avisar si un certificado está por vencer sin renovarse.
- `NEXT_PUBLIC_API_URL`: `https://tudominio.com/api/v1`.
- `SUPERADMIN_SEED_*`: nombre/email/contraseña de tu propia cuenta de SuperAdmin.

## 4. Primer arranque (solo HTTP)

Todavía no existe certificado, así que el bloque HTTPS de `default.conf.template` no puede usarse (Nginx no arranca si le faltan los archivos del certificado). Se usa `bootstrap.conf.template` primero:

```bash
cp docker/nginx/bootstrap.conf.template docker/nginx/active.conf.template
docker compose -f docker-compose.prod.yml up -d --build
```

Verificar: `curl http://tudominio.com/api/v1/health` debe devolver `200`.

## 5. Emitir el primer certificado

```bash
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email
```

## 6. Pasar a HTTPS

```bash
cp docker/nginx/default.conf.template docker/nginx/active.conf.template
docker compose -f docker-compose.prod.yml restart nginx
```

Verificar: `https://tudominio.com` carga con candado. A partir de acá, `active.conf.template` no se vuelve a tocar salvo que cambie la config de Nginx.

## 7. Migraciones y SuperAdmin

La imagen de producción de la API no incluye el CLI de Prisma (es una dependencia de desarrollo, se poda a propósito para mantener la imagen chica) — se usa `npx` para traerlo al vuelo, una vez, en cada paso que lo necesita.

Aplicar las migraciones:

```bash
docker compose -f docker-compose.prod.yml exec api npx --yes prisma@5.22.0 migrate deploy
```

Crear la cuenta de SuperAdmin (usa las variables `SUPERADMIN_SEED_*` de `.env`, ya cargadas en el contenedor):

```bash
docker compose -f docker-compose.prod.yml exec api node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const password = await bcrypt.hash(process.env.SUPERADMIN_SEED_PASSWORD, 10);
  const sa = await prisma.superAdmin.upsert({
    where: { email: process.env.SUPERADMIN_SEED_EMAIL },
    update: { name: process.env.SUPERADMIN_SEED_NAME, password },
    create: { name: process.env.SUPERADMIN_SEED_NAME, email: process.env.SUPERADMIN_SEED_EMAIL, password },
  });
  console.log('SuperAdmin listo:', sa.email, sa.id);
  await prisma.\$disconnect();
})();
"
```

(Verificado a mano contra una base real antes de escribir este paso — funciona sin necesitar `ts-node`.)

## 8. Renovación del certificado

El servicio `certbot` de `docker-compose.prod.yml` corre en loop y renueva solo cuando el certificado está por vencer — no hace falta cron para eso. Lo que sí hace falta: Nginx no relee el certificado nuevo solo porque el archivo cambió en disco, hay que decirle que recargue. Agregar en el VPS (`crontab -e`) una línea que lo haga una vez al mes:

```cron
0 4 1 * * cd /ruta/al/repo && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## 9. Actualizar a una versión nueva

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api npx --yes prisma@5.22.0 migrate deploy
```

## Notas

- Solo Nginx expone puertos al host (80/443) — Postgres, la API y el Web solo son alcanzables entre contenedores.
- El límite de tamaño de body en Nginx (`client_max_body_size 3m`) tiene que ser mayor al límite de la API (2MB, `apps/api/src/main.ts`) — si se cambia uno, revisar el otro.
- Los secretos (`.env`) nunca se commitean; en el VPS, tratarlo con los mismos cuidados que en local (no se sube a ningún lado salvo el propio servidor).
