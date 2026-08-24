import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { AppointmentQueryDto } from "./appointment-query.dto";

async function validateDto(payload: Record<string, unknown>) {
  const instance = plainToInstance(AppointmentQueryDto, payload);
  const errors = await validate(instance, { whitelist: true });
  return errors;
}

describe("AppointmentQueryDto", () => {
  it("acepta date en formato YYYY-MM-DD", async () => {
    const errors = await validateDto({ date: "2026-08-24" });
    expect(errors).toHaveLength(0);
  });

  // Regresión: un ISO datetime completo (lo que devuelve Date.toISOString())
  // ya no debe pasar la validación — parseDateParam solo entiende
  // YYYY-MM-DD, y aceptar más formatos reabre el bug de husos horarios que
  // esto corrige (ver appointments.service.ts).
  it("rechaza un ISO datetime completo en date", async () => {
    const errors = await validateDto({ date: "2026-08-24T06:00:00.000Z" });
    expect(errors.some((e) => e.property === "date")).toBe(true);
  });

  it("acepta since en formato YYYY-MM-DD", async () => {
    const errors = await validateDto({ since: "2026-06-01" });
    expect(errors).toHaveLength(0);
  });
});
