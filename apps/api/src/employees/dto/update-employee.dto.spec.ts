import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UpdateEmployeeDto } from "./update-employee.dto";

async function validateDto(payload: Record<string, unknown>) {
  const instance = plainToInstance(UpdateEmployeeDto, payload);
  const errors = await validate(instance, { whitelist: true });
  return { instance, errors };
}

describe("UpdateEmployeeDto", () => {
  it("acepta un payload vacío (todos los campos son opcionales)", async () => {
    const { errors } = await validateDto({});
    expect(errors).toHaveLength(0);
  });

  it("acepta actualizar solo el name", async () => {
    const { errors } = await validateDto({ name: "Nuevo Nombre" });
    expect(errors).toHaveLength(0);
  });

  it("password sigue siendo opcional (reset explícito del dueño)", async () => {
    const { errors } = await validateDto({ password: "nuevaPassword123" });
    expect(errors).toHaveLength(0);
  });

  it("rechaza password corta si se manda", async () => {
    const { errors } = await validateDto({ password: "corta" });
    expect(errors.some((e) => e.property === "password")).toBe(true);
  });

  // Mismo chequeo de escalada de privilegios que en create: PartialType hereda
  // los decoradores de CreateEmployeeDto, así que role/tenantId tampoco deben
  // poder colarse en un update.
  it("descarta role/tenantId si un cliente los manda igual", async () => {
    const { instance, errors } = await validateDto({
      name: "Ana",
      role: "owner",
      tenantId: "otro-tenant-id",
    });
    expect(errors).toHaveLength(0);
    const unsafe = instance as unknown as { role?: string; tenantId?: string };
    expect(unsafe.role).toBeUndefined();
    expect(unsafe.tenantId).toBeUndefined();
  });
});
