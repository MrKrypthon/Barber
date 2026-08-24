import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { Appointment, BusinessSettings, Customer, Tenant, WhatsAppConnection } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { formatDateLabel, formatTimeLabel } from "./date-labels.util";
import { WhatsAppApiService } from "./whatsapp-api.service";

const REMINDER_TEMPLATE_NAME = "recordatorio_turno";
const REMINDER_LANGUAGE = "es";

// Cuánto antes del turno se manda el recordatorio, y cada cuánto corre el
// cron a revisar — deben coincidir (la ventana = la frecuencia) para que
// cada turno caiga en exactamente una pasada, ni se salte ni se duplique.
const HOURS_BEFORE = 2;
const CRON_INTERVAL_MINUTES = 15;

type AppointmentWithRelations = Appointment & {
  customer: Customer;
  tenant: Tenant & { whatsappConnection: WhatsAppConnection | null; businessSettings: BusinessSettings | null };
};

@Injectable()
export class RemindersCron {
  private readonly logger = new Logger(RemindersCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsAppApi: WhatsAppApiService,
  ) {}

  @Cron(`*/${CRON_INTERVAL_MINUTES} * * * *`)
  async sendUpcomingReminders(): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() + HOURS_BEFORE * 60 * 60_000);
    const windowEnd = new Date(windowStart.getTime() + CRON_INTERVAL_MINUTES * 60_000);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        deletedAt: null,
        reminderSentAt: null,
        startAt: { gte: windowStart, lt: windowEnd },
      },
      include: {
        customer: true,
        tenant: { include: { whatsappConnection: true, businessSettings: true } },
      },
    });

    for (const appointment of appointments) {
      await this.sendReminder(appointment);
    }
  }

  private async sendReminder(appointment: AppointmentWithRelations): Promise<void> {
    const connection = appointment.tenant.whatsappConnection;
    const phone = appointment.customer.phone;
    const remindersEnabled = appointment.tenant.businessSettings?.remindersEnabled ?? true;
    // Sin conexión de WhatsApp, sin teléfono del cliente, o con el
    // recordatorio apagado a mano en Configuración, no hay nada que
    // mandar — no es un error, la mayoría de los negocios todavía no
    // conectó WhatsApp.
    if (!connection || !phone || !remindersEnabled) {
      return;
    }

    try {
      await this.whatsAppApi.sendTemplateMessage({
        phoneNumberId: connection.phoneNumberId,
        accessToken: connection.accessToken,
        to: phone.replace(/\D/g, ""),
        templateName: REMINDER_TEMPLATE_NAME,
        languageCode: REMINDER_LANGUAGE,
        parameters: [
          appointment.customer.name,
          appointment.tenant.name,
          formatDateLabel(appointment.startAt),
          formatTimeLabel(appointment.startAt),
        ],
      });
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: new Date() },
      });
    } catch (err) {
      // Un fallo de WhatsApp (credenciales vencidas, plantilla rechazada,
      // etc.) no debe tumbar el cron para el resto de los turnos de la
      // pasada — se loguea y se reintenta en la próxima corrida (no se
      // marca reminderSentAt).
      this.logger.error(`No se pudo enviar el recordatorio del turno ${appointment.id}`, err);
    }
  }
}
