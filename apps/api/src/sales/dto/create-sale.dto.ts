import { PaymentMethod } from "@prisma/client";
import { ArrayNotEmpty, IsArray, IsEnum, IsOptional, IsUUID } from "class-validator";

export class CreateSaleDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID("4", { each: true })
  serviceIds!: string[];

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}
