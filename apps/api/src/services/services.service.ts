import { Injectable, NotFoundException } from "@nestjs/common";
import { Service } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";

export type ServiceResponse = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  durationMinutes: number | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toServiceResponse(service: Service): ServiceResponse {
  return {
    id: service.id,
    name: service.name,
    price: Number(service.price),
    active: service.active,
    durationMinutes: service.durationMinutes,
    color: service.color,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<ServiceResponse[]> {
    const services = await this.prisma.service.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return services.map(toServiceResponse);
  }

  async create(tenantId: string, dto: CreateServiceDto): Promise<ServiceResponse> {
    const service = await this.prisma.service.create({
      data: {
        tenantId,
        name: dto.name,
        price: dto.price,
        active: dto.active ?? true,
        durationMinutes: dto.durationMinutes,
        color: dto.color,
      },
    });
    return toServiceResponse(service);
  }

  async update(tenantId: string, id: string, dto: UpdateServiceDto): Promise<ServiceResponse> {
    await this.findOwned(tenantId, id);
    const service = await this.prisma.service.update({
      where: { id },
      data: dto,
    });
    return toServiceResponse(service);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOwned(tenantId, id);
    await this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Nunca se confía en un id sin verificar que pertenece al tenant del
  // request; evita que un tenant acceda o modifique recursos de otro
  // (CLAUDE.md §5).
  private async findOwned(tenantId: string, id: string): Promise<Service> {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!service) {
      throw new NotFoundException("Servicio no encontrado");
    }
    return service;
  }
}
