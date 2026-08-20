import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CashClosing, CashMovement, CashMovementType, PaymentMethod, User } from "@prisma/client";
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
  date: Date;
  income: number;
  expense: number;
  balance: number;
  closedBy: { id: string; name: string };
  closedAt: Date;
};

export type CashClosingDetailResponse = CashClosingResponse & {
  movements: CashMovementResponse[];
};

export type CashReportDayResponse = {
  date: Date;
  income: number;
  expense: number;
  balance: number;
  movements: CashMovementResponse[];
};

export type CashReportResponse = {
  from: Date;
  to: Date;
  income: number;
  expense: number;
  balance: number;
  days: CashReportDayResponse[];
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

function toCashClosingResponse(closing: CashClosing & { closedBy: User }): CashClosingResponse {
  return {
    id: closing.id,
    date: closing.date,
    income: Number(closing.income),
    expense: Number(closing.expense),
    balance: Number(closing.balance),
    closedBy: { id: closing.closedBy.id, name: closing.closedBy.name },
    closedAt: closing.createdAt,
  };
}

// "YYYY-MM-DD" → Date anclada al mediodía local de ese día calendario.
// new Date("YYYY-MM-DD") NO sirve acá: ese formato lo interpreta como
// medianoche UTC (a diferencia de un ISO con hora), así que en cualquier
// servidor con huso horario detrás de UTC (todo el continente americano)
// el día calendario local queda corrido uno para atrás — justo el caso de
// closings, que se guardan y buscan por día calendario local
// (getDateRangeBounds usa getFullYear/getMonth/getDate, siempre locales).
function parseDateParam(dateParam: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
  if (!match) {
    throw new BadRequestException("Fecha inválida, se espera YYYY-MM-DD");
  }
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

// Clave de agrupación por día calendario local — mismo criterio que
// parseDateParam de arriba, nunca vía toISOString (eso desplaza el día en
// husos horarios detrás de UTC).
function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Reporte por rango (semana/quincena/mes/personalizado, docs/ROADMAP.md
// v0.3): no puede superar un año, para que nadie pida un reporte gigante
// por accidente (o a propósito) y tumbe la consulta.
const MAX_REPORT_DAYS = 366;

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

    return toCashClosingResponse(closing);
  }

  // Historial de cortes ya hechos (para poder volver a descargar el PDF de
  // un día anterior) — solo los números guardados al cerrar, sin
  // movimientos (esos se piden por día con findClosingByDate).
  async findClosings(tenantId: string): Promise<CashClosingResponse[]> {
    const closings = await this.prisma.cashClosing.findMany({
      where: { tenantId },
      include: { closedBy: true },
      orderBy: { date: "desc" },
    });
    return closings.map(toCashClosingResponse);
  }

  // Detalle de un corte ya hecho, con sus movimientos, para regenerar el
  // PDF de un día anterior. Los totales vienen del snapshot guardado al
  // cerrar (CashClosing), no se recalculan — es un registro de auditoría
  // inmutable, docs/DATABASE.md.
  async findClosingByDate(tenantId: string, dateParam: string): Promise<CashClosingDetailResponse> {
    const bounds = getDateRangeBounds("today", parseDateParam(dateParam))!;

    const [closing, movements] = await Promise.all([
      this.prisma.cashClosing.findUnique({
        where: { tenantId_date: { tenantId, date: bounds.start } },
        include: { closedBy: true },
      }),
      this.prisma.cashMovement.findMany({
        where: { tenantId, createdAt: { gte: bounds.start, lt: bounds.end } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!closing) {
      throw new NotFoundException("No hay un corte de caja para ese día");
    }

    return { ...toCashClosingResponse(closing), movements: movements.map(toCashMovementResponse) };
  }

  // Reporte de un rango arbitrario (semana/quincena/mes/personalizado): a
  // diferencia de CashClosing, no depende de que cada día se haya cerrado —
  // calcula en vivo a partir de ventas en efectivo + movimientos manuales,
  // mismo criterio que getSummary("week"|"month"), pero desglosado día por
  // día para poder mostrar el detalle de cada uno en el PDF.
  async getReport(tenantId: string, fromParam: string, toParam: string): Promise<CashReportResponse> {
    const from = parseDateParam(fromParam);
    const to = parseDateParam(toParam);
    if (from > to) {
      throw new BadRequestException('"from" no puede ser posterior a "to"');
    }

    const rangeEnd = new Date(to);
    rangeEnd.setDate(rangeEnd.getDate() + 1);

    const dayCount = Math.round((rangeEnd.getTime() - from.getTime()) / 86_400_000);
    if (dayCount > MAX_REPORT_DAYS) {
      throw new BadRequestException(`El rango no puede superar ${MAX_REPORT_DAYS} días`);
    }

    const [cashSales, movements] = await Promise.all([
      this.prisma.sale.findMany({
        where: { tenantId, paymentMethod: PaymentMethod.cash, createdAt: { gte: from, lt: rangeEnd } },
        select: { total: true, createdAt: true },
      }),
      this.prisma.cashMovement.findMany({
        where: { tenantId, createdAt: { gte: from, lt: rangeEnd } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const days = new Map<string, CashReportDayResponse>();
    for (let d = new Date(from); d < rangeEnd; d.setDate(d.getDate() + 1)) {
      days.set(dayKey(d), { date: new Date(d), income: 0, expense: 0, balance: 0, movements: [] });
    }

    for (const sale of cashSales) {
      const day = days.get(dayKey(sale.createdAt));
      if (day) day.income += Number(sale.total);
    }
    for (const movement of movements) {
      const day = days.get(dayKey(movement.createdAt));
      if (!day) continue;
      const amount = Number(movement.amount);
      if (movement.type === CashMovementType.income) day.income += amount;
      else day.expense += amount;
      day.movements.push(toCashMovementResponse(movement));
    }

    let income = 0;
    let expense = 0;
    for (const day of days.values()) {
      day.balance = day.income - day.expense;
      income += day.income;
      expense += day.expense;
    }

    return { from, to, income, expense, balance: income - expense, days: [...days.values()] };
  }
}
