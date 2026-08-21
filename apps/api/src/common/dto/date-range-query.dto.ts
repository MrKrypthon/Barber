import { IsIn, IsOptional, Matches } from "class-validator";
import { DateRange } from "../utils/date-range.util";

export class DateRangeQueryDto {
  @IsOptional()
  @IsIn(["today", "week", "month"])
  range?: DateRange;

  // Cota inferior abierta ("desde esta fecha hasta ahora"), alternativa a
  // range para pedir una ventana que no coincide con ninguno de los
  // buckets fijos — la usa el Panel del administrador para no traer todo
  // el historial de ventas al calcular sus estadísticas.
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "since debe tener formato YYYY-MM-DD" })
  since?: string;
}
