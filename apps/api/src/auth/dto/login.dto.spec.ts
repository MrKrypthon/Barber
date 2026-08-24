import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { LoginDto } from "./login.dto";

async function validateDto(payload: Record<string, unknown>) {
  const instance = plainToInstance(LoginDto, payload);
  const errors = await validate(instance, { whitelist: true });
  return { instance, errors };
}

describe("LoginDto", () => {
  const valid = { email: "juan@example.com", password: "supersecreta" };

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
});
