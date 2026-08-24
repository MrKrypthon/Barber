import { Injectable } from "@nestjs/common";
import { WhatsAppConnection } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateWhatsAppConnectionDto } from "./dto/update-whatsapp-connection.dto";

// El access token nunca se devuelve completo por la API — solo los últimos
// 4 caracteres, para que el dueño pueda confirmar visualmente que cargó el
// correcto sin que quede expuesto en ninguna respuesta HTTP.
export type WhatsAppConnectionResponse = {
  connected: boolean;
  phoneNumberId: string | null;
  wabaId: string | null;
  accessTokenPreview: string | null;
};

function toResponse(connection: WhatsAppConnection | null): WhatsAppConnectionResponse {
  if (!connection) {
    return { connected: false, phoneNumberId: null, wabaId: null, accessTokenPreview: null };
  }
  return {
    connected: true,
    phoneNumberId: connection.phoneNumberId,
    wabaId: connection.wabaId,
    accessTokenPreview: `••••${connection.accessToken.slice(-4)}`,
  };
}

@Injectable()
export class WhatsAppConnectionService {
  constructor(private readonly prisma: PrismaService) {}

  async get(tenantId: string): Promise<WhatsAppConnectionResponse> {
    const connection = await this.prisma.whatsAppConnection.findUnique({ where: { tenantId } });
    return toResponse(connection);
  }

  async upsert(
    tenantId: string,
    dto: UpdateWhatsAppConnectionDto,
  ): Promise<WhatsAppConnectionResponse> {
    const connection = await this.prisma.whatsAppConnection.upsert({
      where: { tenantId },
      update: {
        phoneNumberId: dto.phoneNumberId,
        wabaId: dto.wabaId,
        accessToken: dto.accessToken,
      },
      create: {
        tenantId,
        phoneNumberId: dto.phoneNumberId,
        wabaId: dto.wabaId,
        accessToken: dto.accessToken,
      },
    });
    return toResponse(connection);
  }

  async remove(tenantId: string): Promise<void> {
    // deleteMany (no delete) porque no hay que romper si nunca se conectó.
    await this.prisma.whatsAppConnection.deleteMany({ where: { tenantId } });
  }

  // Uso interno (cron de recordatorios, envío de recibos) — acá sí hace
  // falta el token completo para llamar a la Graph API de Meta. Nunca se
  // expone a través de un controller.
  async getCredentials(
    tenantId: string,
  ): Promise<{ phoneNumberId: string; accessToken: string } | null> {
    const connection = await this.prisma.whatsAppConnection.findUnique({ where: { tenantId } });
    if (!connection) return null;
    return { phoneNumberId: connection.phoneNumberId, accessToken: connection.accessToken };
  }
}
