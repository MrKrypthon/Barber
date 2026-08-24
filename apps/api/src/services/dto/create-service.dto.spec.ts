import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateServiceDto } from "./create-service.dto";

async function validateDto(payload: Record<string, unknown>) {
  const instance = plainToInstance(CreateServiceDto, payload);
  const errors = await validate(instance, { whitelist: true });
  return { instance, errors };
}

describe("CreateServiceDto", () => {
  const valid = { name: "Corte clásico", price: 1500 };

  it("acepta un payload válido", async () => {
    const { errors } = await validateDto(valid);
    expect(errors).toHaveLength(0);
  });

  it("rechaza name que excede el límite de longitud", async () => {
    const { errors } = await validateDto({ ...valid, name: "a".repeat(201) });
    expect(errors.some((e) => e.property === "name")).toBe(true);
  });

  it("rechaza price negativo", async () => {
    const { errors } = await validateDto({ ...valid, price: -10 });
    expect(errors.some((e) => e.property === "price")).toBe(true);
  });

  it("rechaza durationMinutes menor a 1", async () => {
    const { errors } = await validateDto({ ...valid, durationMinutes: 0 });
    expect(errors.some((e) => e.property === "durationMinutes")).toBe(true);
  });

  it("rechaza color que no es hex válido", async () => {
    const { errors } = await validateDto({ ...valid, color: "no-es-un-color" });
    expect(errors.some((e) => e.property === "color")).toBe(true);
  });

  it("acepta commissionPercent en 0-100", async () => {
    const { errors } = await validateDto({ ...valid, commissionPercent: 50 });
    expect(errors).toHaveLength(0);
  });

  it("rechaza commissionPercent negativo", async () => {
    const { errors } = await validateDto({ ...valid, commissionPercent: -1 });
    expect(errors.some((e) => e.property === "commissionPercent")).toBe(true);
  });

  it("rechaza commissionPercent mayor a 100", async () => {
    const { errors } = await validateDto({ ...valid, commissionPercent: 101 });
    expect(errors.some((e) => e.property === "commissionPercent")).toBe(true);
  });
});
