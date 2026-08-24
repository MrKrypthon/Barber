import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateProductDto } from "./create-product.dto";

async function validateDto(payload: Record<string, unknown>) {
  const instance = plainToInstance(CreateProductDto, payload);
  const errors = await validate(instance, { whitelist: true });
  return { instance, errors };
}

describe("CreateProductDto", () => {
  it("acepta un payload válido", async () => {
    const { errors } = await validateDto({ name: "Pomada" });
    expect(errors).toHaveLength(0);
  });

  it("rechaza name que excede el límite de longitud", async () => {
    const { errors } = await validateDto({ name: "a".repeat(201) });
    expect(errors.some((e) => e.property === "name")).toBe(true);
  });

  it("rechaza photo que excede MAX_PHOTO_LENGTH", async () => {
    const { errors } = await validateDto({ name: "Pomada", photo: "a".repeat(300_001) });
    expect(errors.some((e) => e.property === "photo")).toBe(true);
  });

  it("rechaza stock negativo", async () => {
    const { errors } = await validateDto({ name: "Pomada", stock: -1 });
    expect(errors.some((e) => e.property === "stock")).toBe(true);
  });

  it("rechaza minStock negativo", async () => {
    const { errors } = await validateDto({ name: "Pomada", minStock: -1 });
    expect(errors.some((e) => e.property === "minStock")).toBe(true);
  });

  it("acepta minStock null (borrar mínimo configurado)", async () => {
    const { errors } = await validateDto({ name: "Pomada", minStock: null });
    expect(errors).toHaveLength(0);
  });
});
