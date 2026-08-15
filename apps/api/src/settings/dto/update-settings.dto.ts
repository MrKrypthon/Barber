import { IsArray, IsHexColor, IsIn, IsOptional, IsString, Matches, MinLength } from "class-validator";

const SCHEDULE_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  businessName?: string;

  // Data URI (base64) ya redimensionada/comprimida en el cliente —
  // ver ADR-008 (docs/DECISIONS.md).
  @IsOptional()
  @IsString()
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
  phone?: string;

  @IsOptional()
  @IsString()
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
}
