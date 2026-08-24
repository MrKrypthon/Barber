import { IsString, MinLength } from "class-validator";

export class UpdateWhatsAppConnectionDto {
  @IsString()
  @MinLength(1)
  phoneNumberId!: string;

  @IsString()
  @MinLength(1)
  wabaId!: string;

  @IsString()
  @MinLength(1)
  accessToken!: string;
}
