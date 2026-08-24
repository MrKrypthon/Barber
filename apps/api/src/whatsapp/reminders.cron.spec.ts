import { PrismaService } from "../prisma/prisma.service";
import { RemindersCron } from "./reminders.cron";
import { WhatsAppApiService } from "./whatsapp-api.service";

describe("RemindersCron", () => {
  let cron: RemindersCron;
  let prisma: {
    appointment: { findMany: jest.Mock; update: jest.Mock };
  };
  let whatsAppApi: { sendTemplateMessage: jest.Mock };

  const connection = { phoneNumberId: "123456", accessToken: "token-abc" };
  const tenant = {
    id: "tenant-1",
    name: "Mi Barbería",
    whatsappConnection: connection,
    businessSettings: { remindersEnabled: true },
  };
  const customer = { name: "Juan Pérez", phone: "+52 55 1234 5678" };

  function appointmentFixture(overrides: Record<string, unknown> = {}) {
    return {
      id: "appt-1",
      startAt: new Date(2026, 7, 24, 16, 0),
      customer,
      tenant,
      ...overrides,
    };
  }

  beforeEach(() => {
    prisma = {
      appointment: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
    };
    whatsAppApi = { sendTemplateMessage: jest.fn().mockResolvedValue(undefined) };
    cron = new RemindersCron(prisma as unknown as PrismaService, whatsAppApi as unknown as WhatsAppApiService);
  });

  it("consulta turnos sin recordatorio enviado, en la ventana de ~2 horas", async () => {
    await cron.sendUpcomingReminders();

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null, reminderSentAt: null }),
      }),
    );
  });

  it("manda la plantilla con nombre del cliente, negocio, fecha y hora, y marca reminderSentAt", async () => {
    prisma.appointment.findMany.mockResolvedValue([appointmentFixture()]);

    await cron.sendUpcomingReminders();

    expect(whatsAppApi.sendTemplateMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        phoneNumberId: "123456",
        accessToken: "token-abc",
        to: "525512345678",
        templateName: "recordatorio_turno",
        languageCode: "es",
        parameters: ["Juan Pérez", "Mi Barbería", expect.any(String), expect.any(String)],
      }),
    );
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: "appt-1" },
      data: { reminderSentAt: expect.any(Date) },
    });
  });

  it("no manda nada si el tenant no conectó WhatsApp", async () => {
    prisma.appointment.findMany.mockResolvedValue([
      appointmentFixture({ tenant: { ...tenant, whatsappConnection: null } }),
    ]);

    await cron.sendUpcomingReminders();

    expect(whatsAppApi.sendTemplateMessage).not.toHaveBeenCalled();
    expect(prisma.appointment.update).not.toHaveBeenCalled();
  });

  it("no manda nada si el cliente no tiene teléfono cargado", async () => {
    prisma.appointment.findMany.mockResolvedValue([
      appointmentFixture({ customer: { ...customer, phone: null } }),
    ]);

    await cron.sendUpcomingReminders();

    expect(whatsAppApi.sendTemplateMessage).not.toHaveBeenCalled();
  });

  it("no manda nada si el negocio apagó los recordatorios en Configuración", async () => {
    prisma.appointment.findMany.mockResolvedValue([
      appointmentFixture({
        tenant: { ...tenant, businessSettings: { remindersEnabled: false } },
      }),
    ]);

    await cron.sendUpcomingReminders();

    expect(whatsAppApi.sendTemplateMessage).not.toHaveBeenCalled();
  });

  it("manda el recordatorio si nunca se configuró business_settings (default habilitado)", async () => {
    prisma.appointment.findMany.mockResolvedValue([
      appointmentFixture({ tenant: { ...tenant, businessSettings: null } }),
    ]);

    await cron.sendUpcomingReminders();

    expect(whatsAppApi.sendTemplateMessage).toHaveBeenCalled();
  });

  it("si falla el envío, loguea pero no marca reminderSentAt (para reintentar la próxima pasada)", async () => {
    prisma.appointment.findMany.mockResolvedValue([appointmentFixture()]);
    whatsAppApi.sendTemplateMessage.mockRejectedValue(new Error("credenciales vencidas"));

    await expect(cron.sendUpcomingReminders()).resolves.toBeUndefined();

    expect(prisma.appointment.update).not.toHaveBeenCalled();
  });

  it("un turno que falla no interrumpe el envío de los siguientes", async () => {
    whatsAppApi.sendTemplateMessage.mockRejectedValueOnce(new Error("falla")).mockResolvedValueOnce(undefined);
    prisma.appointment.findMany.mockResolvedValue([
      appointmentFixture({ id: "appt-1" }),
      appointmentFixture({ id: "appt-2" }),
    ]);

    await cron.sendUpcomingReminders();

    expect(whatsAppApi.sendTemplateMessage).toHaveBeenCalledTimes(2);
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: "appt-2" },
      data: { reminderSentAt: expect.any(Date) },
    });
  });
});
