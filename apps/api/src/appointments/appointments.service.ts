import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Appointment, Prisma } from "@prisma/client";
import { DateRange, getDateRangeBounds, parseDateParam } from "../common/utils/date-range.util";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";

const APPOINTMENT_INCLUDE = {
  customer: true,
  service: true,
  employee: true,
} satisfies Prisma.AppointmentInclude;

type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof APPOINTMENT_INCLUDE;
}>;

export type AppointmentResponse = {
  id: string;
  customer: { id: string; name: string };
  service: { id: string; name: string; color: string | null };
  employee: { id: string; name: string };
  startAt: Date;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
};

function toAppointmentResponse(appointment: AppointmentWithRelations): AppointmentResponse {
  return {
    id: appointment.id,
    customer: { id: appointment.customer.id, name: appointment.customer.name },
    service: {
      id: appointment.service.id,
      name: appointment.service.name,
      color: appointment.service.color,
    },
    employee: { id: appointment.employee.id, name: appointment.employee.name },
    startAt: appointment.startAt,
    durationMinutes: appointment.durationMinutes,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  };
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Sin range, devuelve todos los turnos del tenant (igual que sales/customers
  // cuando no se pasa filtro), en vez de asumir "today" implícitamente.
  // since: cota inferior abierta, mismo criterio que sales — para el Panel
  // del administrador, que necesita una ventana de meses, no todo el
  // historial.
  async findAll(
    tenantId: string,
    range?: DateRange,
    date?: string,
    since?: string,
  ): Promise<AppointmentResponse[]> {
    const bounds = getDateRangeBounds(range, date ? parseDateParam(date) : undefined);
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(bounds ? { startAt: { gte: bounds.start, lt: bounds.end } } : {}),
        ...(since ? { startAt: { gte: parseDateParam(since) } } : {}),
      },
      include: APPOINTMENT_INCLUDE,
      orderBy: { startAt: "asc" },
    });
    return appointments.map(toAppointmentResponse);
  }

  async create(
    tenantId: string,
    requestingUserId: string,
    dto: CreateAppointmentDto,
  ): Promise<AppointmentResponse> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId, deletedAt: null },
    });
    if (!customer) {
      throw new NotFoundException("Cliente no encontrado");
    }

    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, tenantId, deletedAt: null },
    });
    if (!service) {
      throw new NotFoundException("Servicio no encontrado");
    }
    if (service.durationMinutes == null) {
      throw new BadRequestException("El servicio no tiene una duración configurada");
    }

    const employeeId = dto.employeeId ?? requestingUserId;
    const employee = await this.prisma.user.findFirst({
      where: { id: employeeId, tenantId, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundException("Empleado no encontrado");
    }

    const startAt = new Date(dto.startAt);
    await this.assertNoOverlap(tenantId, employeeId, startAt, service.durationMinutes);

    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId,
        customerId: customer.id,
        serviceId: service.id,
        employeeId,
        startAt,
        durationMinutes: service.durationMinutes,
      },
      include: APPOINTMENT_INCLUDE,
    });

    return toAppointmentResponse(appointment);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAppointmentDto,
  ): Promise<AppointmentResponse> {
    const existing = await this.findOwned(tenantId, id);

    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, tenantId, deletedAt: null },
      });
      if (!customer) {
        throw new NotFoundException("Cliente no encontrado");
      }
    }

    let serviceId = existing.serviceId;
    let durationMinutes = existing.durationMinutes;
    if (dto.serviceId) {
      const service = await this.prisma.service.findFirst({
        where: { id: dto.serviceId, tenantId, deletedAt: null },
      });
      if (!service) {
        throw new NotFoundException("Servicio no encontrado");
      }
      if (service.durationMinutes == null) {
        throw new BadRequestException("El servicio no tiene una duración configurada");
      }
      serviceId = service.id;
      durationMinutes = service.durationMinutes;
    }

    if (dto.employeeId) {
      const employee = await this.prisma.user.findFirst({
        where: { id: dto.employeeId, tenantId, deletedAt: null },
      });
      if (!employee) {
        throw new NotFoundException("Empleado no encontrado");
      }
    }
    const employeeId = dto.employeeId ?? existing.employeeId;

    const startAt = dto.startAt ? new Date(dto.startAt) : existing.startAt;

    await this.assertNoOverlap(tenantId, employeeId, startAt, durationMinutes, id);

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        customerId: dto.customerId ?? existing.customerId,
        serviceId,
        employeeId,
        startAt,
        durationMinutes,
      },
      include: APPOINTMENT_INCLUDE,
    });

    return toAppointmentResponse(appointment);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOwned(tenantId, id);
    await this.prisma.appointment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Nunca se confía en un id sin verificar que pertenece al tenant del
  // request; evita que un tenant acceda o modifique recursos de otro
  // (CLAUDE.md §5).
  private async findOwned(tenantId: string, id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!appointment) {
      throw new NotFoundException("Turno no encontrado");
    }
    return appointment;
  }

  // Un mismo empleado no puede tener dos turnos que se solapen. Se acota la
  // búsqueda al día calendario del nuevo turno (los turnos son cortes de
  // pocos minutos, no cruzan medianoche) y el solape se resuelve en memoria
  // porque cada fila tiene su propia duración.
  private async assertNoOverlap(
    tenantId: string,
    employeeId: string,
    startAt: Date,
    durationMinutes: number,
    excludeId?: string,
  ): Promise<void> {
    const endAt = new Date(startAt.getTime() + durationMinutes * 60_000);
    const dayBounds = getDateRangeBounds("today", startAt);
    if (!dayBounds) {
      return;
    }

    const candidates = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        employeeId,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        startAt: { gte: dayBounds.start, lt: dayBounds.end },
      },
    });

    const hasOverlap = candidates.some((appointment) => {
      const existingEnd = appointment.startAt.getTime() + appointment.durationMinutes * 60_000;
      return appointment.startAt.getTime() < endAt.getTime() && existingEnd > startAt.getTime();
    });

    if (hasOverlap) {
      throw new ConflictException("El empleado ya tiene un turno en ese horario");
    }
  }
}
