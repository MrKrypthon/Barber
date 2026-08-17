import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name!: string;

  // Data URI (base64) ya redimensionada/comprimida en el cliente, mismo
  // criterio que Settings.logo (ADR-008, docs/DECISIONS.md).
  @IsOptional()
  @IsString()
  photo?: string;

  // Stock inicial al dar de alta el producto. Sin enviarlo arranca en 0 y se
  // carga con un movimiento de entrada después.
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  // Debajo de este número se marca "stock bajo" en la UI. null/omitido = sin
  // aviso (@IsOptional acepta ambos) — en UpdateProductDto null además sirve
  // para borrar un mínimo ya configurado (mismo criterio que
  // Service.commissionPercent).
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number | null;
}
