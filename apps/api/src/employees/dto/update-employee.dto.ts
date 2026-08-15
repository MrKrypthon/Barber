import { PartialType } from "@nestjs/mapped-types";
import { CreateEmployeeDto } from "./create-employee.dto";

// password es opcional acá (a diferencia de create): el dueño solo la manda
// cuando quiere resetearla, si no se deja la actual sin tocar.
export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
