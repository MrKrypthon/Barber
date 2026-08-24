import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UpdateSettingsDto } from "./update-settings.dto";

async function validateDto(payload: Record<string, unknown>) {
  const instance = plainToInstance(UpdateSettingsDto, payload);
  const errors = await validate(instance, { whitelist: true });
  return { instance, errors };
}

describe("UpdateSettingsDto", () => {
  it("acepta un payload vacío (todos los campos son opcionales)", async () => {
    const { errors } = await validateDto({});
    expect(errors).toHaveLength(0);
  });

  it("rechaza businessName vacío", async () => {
    const { errors } = await validateDto({ businessName: "" });
    expect(errors.some((e) => e.property === "businessName")).toBe(true);
  });

  it("rechaza businessName que excede el límite de longitud", async () => {
    const { errors } = await validateDto({ businessName: "a".repeat(201) });
    expect(errors.some((e) => e.property === "businessName")).toBe(true);
  });

  it("rechaza logo que excede MAX_LOGO_LENGTH", async () => {
    const { errors } = await validateDto({ logo: "a".repeat(300_001) });
    expect(errors.some((e) => e.property === "logo")).toBe(true);
  });

  it("rechaza primaryColor que no es hex válido", async () => {
    const { errors } = await validateDto({ primaryColor: "azul" });
    expect(errors.some((e) => e.property === "primaryColor")).toBe(true);
  });

  it("rechaza phone que excede el límite de longitud", async () => {
    const { errors } = await validateDto({ phone: "1".repeat(31) });
    expect(errors.some((e) => e.property === "phone")).toBe(true);
  });

  it("rechaza address que excede el límite de longitud", async () => {
    const { errors } = await validateDto({ address: "a".repeat(301) });
    expect(errors.some((e) => e.property === "address")).toBe(true);
  });

  it("rechaza un día de scheduleDays fuera del enum permitido", async () => {
    const { errors } = await validateDto({ scheduleDays: ["mon", "funday"] });
    expect(errors.some((e) => e.property === "scheduleDays")).toBe(true);
  });

  it("rechaza scheduleOpen con formato inválido", async () => {
    const { errors } = await validateDto({ scheduleOpen: "9am" });
    expect(errors.some((e) => e.property === "scheduleOpen")).toBe(true);
  });
});
