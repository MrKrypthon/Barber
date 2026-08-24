import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateEmployeeDto } from "./create-employee.dto";

async function validateDto(payload: Record<string, unknown>) {
  const instance = plainToInstance(CreateEmployeeDto, payload);
  const errors = await validate(instance, { whitelist: true });
  return { instance, errors };
}

describe("CreateEmployeeDto", () => {
  const valid = { name: "Ana Gómez", email: "ana@example.com", password: "supersecreta" };

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

  it("rechaza name que excede el límite de longitud", async () => {
    const { errors } = await validateDto({ ...valid, name: "a".repeat(201) });
    expect(errors.some((e) => e.property === "name")).toBe(true);
  });

  // Escalada de privilegios: nada en el DTO permite fijar el rol o el tenant
  // del nuevo empleado — EmployeesService siempre crea con Role.employee
  // dentro del tenant autenticado. Este test confirma que, aunque un cliente
  // malicioso mande esos campos, el ValidationPipe (whitelist: true) los
  // descarta antes de llegar al service.
  it("descarta role/tenantId/id si un cliente los manda igual", async () => {
    const { instance, errors } = await validateDto({
      ...valid,
      role: "owner",
      tenantId: "otro-tenant-id",
      id: "id-arbitrario",
    });
    expect(errors).toHaveLength(0);
    const unsafe = instance as unknown as { role?: string; tenantId?: string; id?: string };
    expect(unsafe.role).toBeUndefined();
    expect(unsafe.tenantId).toBeUndefined();
    expect(unsafe.id).toBeUndefined();
  });
});
