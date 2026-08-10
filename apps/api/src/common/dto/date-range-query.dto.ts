import { IsIn, IsOptional } from "class-validator";
import { DateRange } from "../utils/date-range.util";

export class DateRangeQueryDto {
  @IsOptional()
  @IsIn(["today", "week", "month"])
  range?: DateRange;
}
