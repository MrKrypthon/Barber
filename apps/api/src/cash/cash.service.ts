import { ConflictException, Injectable } from "@nestjs/common";
import { CashMovement, CashMovementType, PaymentMethod } from "@prisma/client";
import { DateRange, getDateRangeBounds } from "../common/utils/date-range.util";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCashMovementDto } from "./dto/create-cash-movement.dto";

export type CashMovementResponse = {
  id: string;
  type: CashMovementType;
  amount: number;
  description: string | null;
  createdAt: Date;
};

export type CashSummaryResponse = {
  range: DateRange;
  income: number;
  expense: number;
  balance: number;
  movements: CashMovementResponse[];
  closedAt: Date | null;
};

export type CashClosingResponse = {
  id: string;
  income: number;
  expense: number;
  balance: number;
  closedBy: { id: string; name: string };
  closedAt: Date;
};

function toCashMovementResponse(movement: CashMovement): CashMovementResponse {
  return {
    id: movement.id,
    type: movement.type,
    amount: Number(movement.amount),
    description: movement.description,
    createdAt: movement.createdAt,
  };
}

@Injectable()
export class CashService {
  constructor(private readonly prisma: PrismaService) {}

  // "Caja actual" = ventas cobradas en efectivo + movimientos manuales de
  // ingreso, menos movimientos manuales de egreso. Las ventas por
  // transferencia no mueven el efectivo en caja (docs/PROJECT.md, Caja).
  async getSummary(tenantId: string, range: DateRange = "today"): Promise<CashSummaryResponse> {
    const bounds = getDateRangeBounds(range)!;
    const dateFilter = { gte: bounds.start, lt: bounds.end };

    const [cashSales, movements, closing] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { tenantId, paymentMethod: PaymentMethod.cash, createdAt: dateFilter },
        _sum: { total: true },
      }),
      this.prisma.cashMovement.findMany({
        where: { tenantId, createdAt: dateFilter },
        orderBy: { createdAt: "desc" },
      }),
      // El corte de caja es por día calendario: solo tiene sentido para
      // range="today" (una semana/mes no tiene un único cierre).
      range === "today"
        ? this.prisma.cashClosing.findUnique({
            where: { tenantId_date: { tenantId, date: bounds.start } },
          })
        : null,
    ]);

    const salesIncome = Number(cashSales._sum.total ?? 0);
    const manualIncome = movements
      .filter((movement) => movement.type === CashMovementType.income)
      .reduce((sum, movement) => sum + Number(movement.amount), 0);
    const expense = movements
      .filter((movement) => movement.type === CashMovementType.expense)
      .reduce((sum, movement) => sum + Number(movement.amount), 0);
    const income = salesIncome + manualIncome;

    return {
      range,
      income,
      expense,
      balance: income - expense,
      movements: movements.map(toCashMovementResponse),
      closedAt: closing?.createdAt ?? null,
    };
  }

  async registerMovement(
    tenantId: string,
    dto: CreateCashMovementDto,
  ): Promise<CashMovementResponse> {
    const movement = await this.prisma.cashMovement.create({
      data: {
        tenantId,
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
      },
    });
    return toCashMovementResponse(movement);
  }

  // Snapshot inmutable del resumen del día — no bloquea nuevos movimientos
  // ni ventas, es un registro de auditoría de "así quedó la caja al
  // cerrar" (docs/ROADMAP.md v0.1, "Corte de caja").
  async close(tenantId: string, userId: string): Promise<CashClosingResponse> {
    const today = getDateRangeBounds("today")!.start;

    const existing = await this.prisma.cashClosing.findUnique({
      where: { tenantId_date: { tenantId, date: today } },
    });
    if (existing) {
      throw new ConflictException("La caja de hoy ya fue cerrada");
    }

    const summary = await this.getSummary(tenantId, "today");

    const closing = await this.prisma.cashClosing.create({
      data: {
        tenantId,
        date: today,
        income: summary.income,
        expense: summary.expense,
        balance: summary.balance,
        closedById: userId,
      },
      include: { closedBy: true },
    });

    return {
      id: closing.id,
      income: Number(closing.income),
      expense: Number(closing.expense),
      balance: Number(closing.balance),
      closedBy: { id: closing.closedBy.id, name: closing.closedBy.name },
      closedAt: closing.createdAt,
    };
  }
}
