import { getDateRangeBounds } from "./date-range.util";

describe("getDateRangeBounds", () => {
  // Miércoles 10 de enero de 2024, 15:00.
  const wednesday = new Date(2024, 0, 10, 15, 0, 0);

  it("devuelve null si no se pide rango", () => {
    expect(getDateRangeBounds(undefined, wednesday)).toBeNull();
  });

  it("today: de medianoche a medianoche del día siguiente", () => {
    const bounds = getDateRangeBounds("today", wednesday)!;
    expect(bounds.start).toEqual(new Date(2024, 0, 10, 0, 0, 0));
    expect(bounds.end).toEqual(new Date(2024, 0, 11, 0, 0, 0));
  });

  it("week: de lunes a lunes siguiente, sin importar el día de hoy", () => {
    const bounds = getDateRangeBounds("week", wednesday)!;
    expect(bounds.start).toEqual(new Date(2024, 0, 8, 0, 0, 0)); // lunes
    expect(bounds.end).toEqual(new Date(2024, 0, 15, 0, 0, 0)); // lunes siguiente
  });

  it("week: un domingo pertenece a la semana que empezó el lunes anterior", () => {
    const sunday = new Date(2024, 0, 14, 10, 0, 0);
    const bounds = getDateRangeBounds("week", sunday)!;
    expect(bounds.start).toEqual(new Date(2024, 0, 8, 0, 0, 0));
    expect(bounds.end).toEqual(new Date(2024, 0, 15, 0, 0, 0));
  });

  it("month: del día 1 al día 1 del mes siguiente", () => {
    const bounds = getDateRangeBounds("month", wednesday)!;
    expect(bounds.start).toEqual(new Date(2024, 0, 1, 0, 0, 0));
    expect(bounds.end).toEqual(new Date(2024, 1, 1, 0, 0, 0));
  });

  it("month: diciembre cruza al año siguiente correctamente", () => {
    const december = new Date(2024, 11, 20, 10, 0, 0);
    const bounds = getDateRangeBounds("month", december)!;
    expect(bounds.start).toEqual(new Date(2024, 11, 1, 0, 0, 0));
    expect(bounds.end).toEqual(new Date(2025, 0, 1, 0, 0, 0));
  });
});
