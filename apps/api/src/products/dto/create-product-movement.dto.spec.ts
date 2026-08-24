import { ProductMovementType } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateProductMovementDto } from "./create-product-movement.dto";

async function validateDto(payload: Record<string, unknown>) {
  const instance = plainToInstance(CreateProductMovementDto, payload);
  const errors = await validate(instance, { whitelist: true });
  return { instance, errors };
}

describe("CreateProductMovementDto", () => {
  const valid = { type: ProductMovementType.entry, quantity: 5 };

  it("acepta un payload válido", async () => {
    const { errors } = await validateDto(valid);
    expect(errors).toHaveLength(0);
  });

  it("rechaza type que no es un ProductMovementType válido", async () => {
    const { errors } = await validateDto({ ...valid, type: "not-a-type" });
    expect(errors.some((e) => e.property === "type")).toBe(true);
  });

  it("rechaza quantity menor a 1", async () => {
    const { errors } = await validateDto({ ...valid, quantity: 0 });
    expect(errors.some((e) => e.property === "quantity")).toBe(true);
  });

  it("rechaza quantity negativa", async () => {
    const { errors } = await validateDto({ ...valid, quantity: -5 });
    expect(errors.some((e) => e.property === "quantity")).toBe(true);
  });

  it("rechaza description que excede el límite de longitud", async () => {
    const { errors } = await validateDto({ ...valid, description: "a".repeat(501) });
    expect(errors.some((e) => e.property === "description")).toBe(true);
  });
});
