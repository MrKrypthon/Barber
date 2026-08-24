import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { RegisterDto } from "./register.dto";

async function validateDto(payload: Record<string, unknown>) {
  const instance = plainToInstance(RegisterDto, payload);
  const errors = await validate(instance, { whitelist: true });
  return { instance, errors };
}

describe("RegisterDto", () => {
  const valid = {
    businessName: "Barbería El Corte",
    ownerName: "Juan Pérez",
    email: "juan@example.com",
    password: "supersecreta",
  };

  it("acepta un payload válido", async () => {
    const { errors } = await validateDto(valid);
    expect(errors).toHaveLength(0);
  });

  it("rechaza email inválido", async () => {
    const { errors } = await validateDto({ ...valid, email: "no-es-un-email" });
    expect(errors.some((e) => e.property === "email")).toBe(true);
  });

  it("rechaza password corta", async () => {
    const { errors } = await validateDto({ ...valid, password: "1234567" });
    expect(errors.some((e) => e.property === "password")).toBe(true);
  });

  it("rechaza password que excede el límite de bcrypt (72 bytes)", async () => {
    const { errors } = await validateDto({ ...valid, password: "a".repeat(73) });
    expect(errors.some((e) => e.property === "password")).toBe(true);
  });

  it("rechaza businessName que excede el límite de longitud", async () => {
    const { errors } = await validateDto({ ...valid, businessName: "a".repeat(201) });
    expect(errors.some((e) => e.property === "businessName")).toBe(true);
  });

  it("rechaza ownerName que excede el límite de longitud", async () => {
    const { errors } = await validateDto({ ...valid, ownerName: "a".repeat(201) });
    expect(errors.some((e) => e.property === "ownerName")).toBe(true);
  });

  // Escalada de privilegios: register() siempre crea el tenant y el usuario
  // con Role.owner (ver AuthService.register) — el DTO no debe aceptar un
  // role explícito del cliente.
  it("descarta role si un cliente lo manda igual", async () => {
    const { instance, errors } = await validateDto({ ...valid, role: "employee" });
    expect(errors).toHaveLength(0);
    expect((instance as unknown as { role?: string }).role).toBeUndefined();
  });
});
