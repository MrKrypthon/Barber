import * as bcrypt from "bcryptjs";

export const SALT_ROUNDS = 10;

// Compartido entre AuthService (registro del owner) y EmployeesService (el
// owner da de alta empleados) — nunca se hashea una contraseña con lógica
// duplicada en más de un lugar.
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}
