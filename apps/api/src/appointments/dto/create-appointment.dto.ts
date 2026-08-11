import { IsDateString, IsOptional, IsUUID } from "class-validator";

export class CreateAppointmentDto {
  @IsUUID()
  customerId!: string;

  @IsUUID()
  serviceId!: string;

  // Si se omite, el turno queda asignado al usuario autenticado que lo registra.
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsDateString()
  startAt!: string;
}
