import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class CreateEmployeeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsEmail()
  email!: string;

  // El dueño define la contraseña inicial del empleado (no hay envío de
  // invitación por correo en el MVP, docs/DECISIONS.md); el empleado puede
  // loguearse con ella de inmediato.
  @IsString()
  @MinLength(8)
  // Mismo criterio que auth/dto/login.dto.ts: bcrypt trunca a 72 bytes.
  @MaxLength(72)
  password!: string;
}
