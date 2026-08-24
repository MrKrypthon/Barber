import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateCustomerDto } from "./create-customer.dto";

// Mismo `whitelist: true` que el ValidationPipe global (apps/api/src/main.ts)
// para reproducir exactamente lo que ve la API en runtime.
async function validateDto(payload: Record<string, unknown>) {
  const instance = plainToInstance(CreateCustomerDto, payload);
  const errors = await validate(instance, { whitelist: true });
  return { instance, errors };
}

describe("CreateCustomerDto", () => {
  it("acepta un payload válido", async () => {
    const { errors } = await validateDto({ name: "Juan Pérez", phone: "1122334455" });
    expect(errors).toHaveLength(0);
  });

  it("rechaza name vacío", async () => {
    const { errors } = await validateDto({ name: "" });
    expect(errors.some((e) => e.property === "name")).toBe(true);
  });

  it("rechaza name sin declarar", async () => {
    const { errors } = await validateDto({});
    expect(errors.some((e) => e.property === "name")).toBe(true);
  });

  it("rechaza name que excede el límite de longitud", async () => {
    const { errors } = await validateDto({ name: "a".repeat(201) });
    expect(errors.some((e) => e.property === "name")).toBe(true);
  });

  it("rechaza phone que excede el límite de longitud", async () => {
    const { errors } = await validateDto({ name: "Juan", phone: "1".repeat(31) });
    expect(errors.some((e) => e.property === "phone")).toBe(true);
  });

  it("rechaza notes que excede el límite de longitud", async () => {
    const { errors } = await validateDto({ name: "Juan", notes: "a".repeat(2001) });
    expect(errors.some((e) => e.property === "notes")).toBe(true);
  });

  it("descarta campos no declarados en el DTO (whitelist)", async () => {
    const { instance, errors } = await validateDto({
      name: "Juan",
      tenantId: "otro-tenant-id",
    });
    expect(errors).toHaveLength(0);
    expect((instance as unknown as { tenantId?: string }).tenantId).toBeUndefined();
  });
});
