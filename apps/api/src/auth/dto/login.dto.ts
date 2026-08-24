import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  // bcrypt trunca la entrada a 72 bytes; sin este tope un payload de varios
  // MB en password igual llegaría entero a bcrypt.compare (auth.service.ts)
  // en cada intento de login, desperdiciando CPU sin ganar nada en seguridad.
  @MaxLength(72)
  password!: string;
}
