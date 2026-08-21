import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CashClosing,
  CashMovement,
  CashMovementType,
  Customer,
  PaymentMethod,
  Sale,
  SaleItem,
  Service,
  User,
} from "@prisma/client";
import { DateRange, getDateRangeBounds, parseDateParam } from "../common/utils/date-range.util";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCashMovementDto } from "./dto/create-cash-movement.dto";

// "Movimiento" en Caja no es solo lo que se carga a mano (CashMovement):
// también incluye cada venta cobrada en efectivo, para poder ver qué
// servicio, a qué cliente y por cuánto se cobró — no solo el total del
// día. source distingue el origen; customerName/serviceNames solo se
// completan para source="sale" (en un CashMovement manual quedan null/[]).
export type CashMovementResponse = {
  id: string;
  type: CashMovementType;
  amount: number;
  description: string | null;
  createdAt: Date;
  source: "manual" | "sale";
  customerName: string | null;
  serviceNames: string[];
};

type SaleWithDetails = Sale & {
  customer: Customer | null;
  items: (SaleItem & { service: Service })[];
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
    source: "manual",
    customerName: null,
    serviceNames: [],
  };
}

function toSaleMovementResponse(sale: SaleWithDetails): CashMovementResponse {
  return {
    id: sale.id,
    type: CashMovementType.income,
    amount: Number(sale.total),
    description: null,
    createdAt: sale.createdAt,
    source: "sale",
    customerName: sale.customer?.name ?? null,
    serviceNames: sale.items.map((item) => item.service.name),
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
      this.prisma.sale.findMany({
        where: { tenantId, paymentMethod: PaymentMethod.cash, createdAt: dateFilter },
        include: { customer: true, items: { include: { service: true } } },
      }),
      this.prisma.cashMovement.findMany({
        where: { tenantId, createdAt: dateFilter },
      }),
      // El corte de caja es por día calendario: solo tiene sentido para
      // range="today" (una semana/mes no tiene un único cierre).
      range === "today"
        ? this.prisma.cashClosing.findUnique({
            where: { tenantId_date: { tenantId, date: bounds.start } },
          })
        : null,
    ]);

    const salesIncome = cashSales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const manualIncome = movements
      .filter((movement) => movement.type === CashMovementType.income)
      .reduce((sum, movement) => sum + Number(movement.amount), 0);
    const expense = movements
      .filter((movement) => movement.type === CashMovementType.expense)
      .reduce((sum, movement) => sum + Number(movement.amount), 0);
    const income = salesIncome + manualIncome;

    const allMovements = [...cashSales.map(toSaleMovementResponse), ...movements.map(toCashMovementResponse)].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return {
      range,
      income,
      expense,
      balance: income - expense,
      movements: allMovements,
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

    const [closing, cashSales, movements] = await Promise.all([
      this.prisma.cashClosing.findUnique({
        where: { tenantId_date: { tenantId, date: bounds.start } },
        include: { closedBy: true },
      }),
      this.prisma.sale.findMany({
        where: {
          tenantId,
          paymentMethod: PaymentMethod.cash,
          createdAt: { gte: bounds.start, lt: bounds.end },
        },
        include: { customer: true, items: { include: { service: true } } },
      }),
      this.prisma.cashMovement.findMany({
        where: { tenantId, createdAt: { gte: bounds.start, lt: bounds.end } },
      }),
    ]);

    if (!closing) {
      throw new NotFoundException("No hay un corte de caja para ese día");
    }

    const allMovements = [...cashSales.map(toSaleMovementResponse), ...movements.map(toCashMovementResponse)].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    return { ...toCashClosingResponse(closing), movements: allMovements };
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
        include: { customer: true, items: { include: { service: true } } },
      }),
      this.prisma.cashMovement.findMany({
        where: { tenantId, createdAt: { gte: from, lt: rangeEnd } },
      }),
    ]);

    const days = new Map<string, CashReportDayResponse>();
    for (let d = new Date(from); d < rangeEnd; d.setDate(d.getDate() + 1)) {
      days.set(dayKey(d), { date: new Date(d), income: 0, expense: 0, balance: 0, movements: [] });
    }

    for (const sale of cashSales) {
      const day = days.get(dayKey(sale.createdAt));
      if (!day) continue;
      day.income += Number(sale.total);
      day.movements.push(toSaleMovementResponse(sale));
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
      day.movements.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      day.balance = day.income - day.expense;
      income += day.income;
      expense += day.expense;
    }

    return { from, to, income, expense, balance: income - expense, days: [...days.values()] };
  }
}
