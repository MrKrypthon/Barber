import { IsString, Matches } from "class-validator";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class CashReportQueryDto {
  @IsString()
  @Matches(DATE_PATTERN, { message: "from debe tener formato YYYY-MM-DD" })
  from!: string;

  @IsString()
  @Matches(DATE_PATTERN, { message: "to debe tener formato YYYY-MM-DD" })
  to!: string;
}
