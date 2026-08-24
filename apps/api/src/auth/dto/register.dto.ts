import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  businessName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  ownerName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  // Mismo criterio que auth/dto/login.dto.ts: bcrypt trunca a 72 bytes.
  @MaxLength(72)
  password!: string;
}
