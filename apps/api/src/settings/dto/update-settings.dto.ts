import { IsHexColor, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  businessName?: string;

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
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
