import { CashMovementType } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateCashMovementDto } from "./create-cash-movement.dto";

async function validateDto(payload: Record<string, unknown>) {
  const instance = plainToInstance(CreateCashMovementDto, payload);
  const errors = await validate(instance, { whitelist: true });
  return { instance, errors };
}

describe("CreateCashMovementDto", () => {
  const valid = { type: CashMovementType.income, amount: 100 };

  it("acepta un payload válido", async () => {
    const { errors } = await validateDto(valid);
    expect(errors).toHaveLength(0);
  });

  it("rechaza type que no es un CashMovementType válido", async () => {
    const { errors } = await validateDto({ ...valid, type: "not-a-type" });
    expect(errors.some((e) => e.property === "type")).toBe(true);
  });

  it("rechaza amount menor o igual a 0", async () => {
    const { errors } = await validateDto({ ...valid, amount: 0 });
    expect(errors.some((e) => e.property === "amount")).toBe(true);
  });

  it("rechaza amount negativo", async () => {
    const { errors } = await validateDto({ ...valid, amount: -50 });
    expect(errors.some((e) => e.property === "amount")).toBe(true);
  });

  it("rechaza description que excede el límite de longitud", async () => {
    const { errors } = await validateDto({ ...valid, description: "a".repeat(501) });
    expect(errors.some((e) => e.property === "description")).toBe(true);
  });
});
