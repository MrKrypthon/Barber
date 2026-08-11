import { IsDateString, IsIn, IsOptional } from "class-validator";

// La agenda navega por día o semana a partir de una fecha de referencia
// arbitraria (no solo "hoy"), por eso se reusa DateRange (common/utils) pero
// con "date" como ancla en vez de depender siempre de la fecha del servidor.
export class AppointmentQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsIn(["today", "week"])
  range?: "today" | "week";
}
