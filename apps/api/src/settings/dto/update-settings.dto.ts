import {
  IsArray,
  IsBoolean,
  IsHexColor,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

const SCHEDULE_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// resizeImageToDataUrl (apps/web/src/lib/image.ts) recorta a 320x320 y
// comprime a JPEG calidad 0.85 — unas decenas de KB en base64. Mismo
// límite que Product.photo (apps/api/src/products/dto/create-product.dto.ts):
// sin esto, logo se devuelve en GET /settings (casi toda carga de página)
// sin tope de tamaño en la base.
const MAX_LOGO_LENGTH = 300_000;

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  businessName?: string;

  // Data URI (base64) ya redimensionada/comprimida en el cliente —
  // ver ADR-008 (docs/DECISIONS.md).
  @IsOptional()
  @IsString()
  @MaxLength(MAX_LOGO_LENGTH)
  logo?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsArray()
  @IsIn(SCHEDULE_DAYS, { each: true })
  scheduleDays?: string[];

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: "scheduleOpen debe tener formato HH:MM" })
  scheduleOpen?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: "scheduleClose debe tener formato HH:MM" })
  scheduleClose?: string;

  @IsOptional()
  @IsBoolean()
  remindersEnabled?: boolean;
}
