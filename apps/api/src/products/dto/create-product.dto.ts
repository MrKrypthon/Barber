import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

// resizeImageToDataUrl (apps/web/src/lib/image.ts) recorta a 320x320 y
// comprime a JPEG calidad 0.85 antes de subir — eso da unas decenas de KB
// en base64. 300.000 caracteres (~300KB) deja margen amplio para eso pero
// evita que alguien mande directo a la API un payload gigante: photo no
// tiene límite de tamaño en la base (Postgres `text`) y se devuelve entero
// en cada GET /products, así que sin tope acá cualquier cuenta autenticada
// podría inflar el storage y volver lenta/pesada esa respuesta para todo
// el tenant.
const MAX_PHOTO_LENGTH = 300_000;

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  // Data URI (base64) ya redimensionada/comprimida en el cliente, mismo
  // criterio que Settings.logo (ADR-008, docs/DECISIONS.md).
  @IsOptional()
  @IsString()
  @MaxLength(MAX_PHOTO_LENGTH)
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
