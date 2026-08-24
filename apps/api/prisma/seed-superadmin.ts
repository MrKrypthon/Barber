// Crea (o actualiza la contraseña de) la única cuenta de SuperAdmin, a
// partir de variables de entorno — no hay registro propio a propósito
// (apps/api/src/superadmin-auth/superadmin-auth.controller.ts).
//
// Uso: pnpm --filter @barber/api seed:superadmin
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

async function main() {
  const name = process.env.SUPERADMIN_SEED_NAME;
  const email = process.env.SUPERADMIN_SEED_EMAIL;
  const password = process.env.SUPERADMIN_SEED_PASSWORD;

  if (!name || !email || !password) {
    console.error(
      "Faltan variables de entorno: SUPERADMIN_SEED_NAME, SUPERADMIN_SEED_EMAIL, SUPERADMIN_SEED_PASSWORD (ver .env.example).",
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const superAdmin = await prisma.superAdmin.upsert({
      where: { email },
      update: { name, password: passwordHash },
      create: { name, email, password: passwordHash },
    });

    console.log(`SuperAdmin listo: ${superAdmin.email} (${superAdmin.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
