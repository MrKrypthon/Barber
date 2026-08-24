import { IsIn, IsOptional, Matches } from "class-validator";

// La agenda navega por día o semana a partir de una fecha de referencia
// arbitraria (no solo "hoy"), por eso se reusa DateRange (common/utils) pero
// con "date" como ancla en vez de depender siempre de la fecha del servidor.
export class AppointmentQueryDto {
  // YYYY-MM-DD, no @IsDateString(): mismo motivo que "since" más abajo —
  // parseDateParam (apps/api/src/common/utils/date-range.util.ts) necesita
  // un día calendario sin hora/zona horaria, nunca un ISO datetime.
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "date debe tener formato YYYY-MM-DD" })
  date?: string;

  @IsOptional()
  @IsIn(["today", "week"])
  range?: "today" | "week";

  // Cota inferior abierta, alternativa a range/date — la usa el Panel del
  // administrador para no traer todo el historial de turnos (mismo
  // criterio que DateRangeQueryDto.since en sales/cash).
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "since debe tener formato YYYY-MM-DD" })
  since?: string;
}
