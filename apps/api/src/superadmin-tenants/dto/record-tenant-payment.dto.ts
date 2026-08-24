import { PaymentMethod } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from "class-validator";

export class RecordTenantPaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  // Hasta qué fecha queda cubierto el negocio con este pago. YYYY-MM-DD
  // estricto (no @IsDateString, que también aceptaría un ISO con hora) —
  // se parsea con parseDateParam, nunca new Date() directo (ver comentario
  // ahí sobre el corrimiento de día en husos horarios detrás de UTC).
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "paidUntil debe tener formato YYYY-MM-DD" })
  paidUntil!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
