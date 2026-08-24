import { ProductMovementType } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateProductMovementDto {
  @IsEnum(ProductMovementType)
  type!: ProductMovementType;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
