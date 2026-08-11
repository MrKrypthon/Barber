"use client";

import { useState } from "react";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { useAgenda } from "@/hooks/use-agenda";
import { cn } from "@/lib/cn";
import { formatLongDate } from "@/lib/format";
import type { Appointment } from "@/mocks/types";
import { ChangeServiceModal } from "./change-service-modal";
import { DayTimeline, HourGutter, useNow } from "./day-timeline";

export function AgendaView() {
  const {
    week,
    selectedDay,
    selectedIndex,
    setSelectedIndex,
    appointments,
    appointmentsFor,
    isLoading,
    isError,
    changeService,
    isChangingService,
  } = useAgenda();
  const now = useNow();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  async function saveServiceChange(serviceId: string) {
    if (!selectedAppointment) return;
    await changeService({ id: selectedAppointment.id, serviceId });
    setSelectedAppointment(null);
  }

  return (
    <div>
      <PageHeader title="Agenda" subtitle={formatLongDate(selectedDay.date)} />

      {/* Móvil: tira semanal para elegir un día (mockup pág. 6). Desktop:
          se ve la semana completa en la grilla, no hace falta elegir. */}
      <div className="mb-5 flex justify-between gap-1 md:hidden">
        {week.map((d) => (
          <button
            key={d.index}
            type="button"
            onClick={() => setSelectedIndex(d.index)}
            aria-pressed={selectedIndex === d.index}
            className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-1.5"
          >
            <span className="text-xs text-neutral-400">{d.dayLabel}</span>
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-150",
                selectedIndex === d.index
                  ? "bg-primary text-white"
                  : d.isToday
                    ? "text-primary"
                    : "text-neutral-600",
              )}
            >
              {d.dayNumber}
            </span>
          </button>
        ))}
      </div>

      {/* Móvil: un solo día. */}
      <Card className="overflow-x-auto md:hidden">
        {isLoading ? (
          <p className="py-10 text-center text-neutral-400">Cargando agenda...</p>
        ) : isError ? (
          <p className="py-10 text-center text-secondary">No se pudo cargar la agenda.</p>
        ) : appointments.length === 0 ? (
          <p className="py-10 text-center text-neutral-400">Sin turnos para este día.</p>
        ) : (
          <div className="flex">
            <HourGutter />
            <DayTimeline
              appointments={appointments}
              now={selectedDay.isToday ? now : null}
              onAppointmentClick={setSelectedAppointment}
            />
          </div>
        )}
      </Card>

      {/* Desktop: semana completa, estilo Google Calendar. */}
      <Card className="hidden overflow-x-auto p-0 md:block">
        <div className="flex min-w-[720px]">
          <div className="w-10 shrink-0 border-b border-neutral-100 py-3" />
          {week.map((d) => (
            <div
              key={d.index}
              className="flex flex-1 flex-col items-center gap-1 border-b border-l border-neutral-100 py-3"
            >
              <span className="text-xs text-neutral-400">{d.dayLabel}</span>
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                  d.isToday ? "bg-primary text-white" : "text-neutral-700",
                )}
              >
                {d.dayNumber}
              </span>
            </div>
          ))}
        </div>
        {isLoading ? (
          <p className="py-10 text-center text-neutral-400">Cargando agenda...</p>
        ) : isError ? (
          <p className="py-10 text-center text-secondary">No se pudo cargar la agenda.</p>
        ) : (
          <div className="flex min-w-[720px] px-0 pb-4 pt-2">
            <HourGutter />
            {week.map((d) => (
              <div key={d.index} className="flex-1 border-l border-neutral-100">
                <DayTimeline
                  appointments={appointmentsFor(d.index)}
                  now={d.isToday ? now : null}
                  onAppointmentClick={setSelectedAppointment}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedAppointment ? (
        <ChangeServiceModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onSave={saveServiceChange}
          isSaving={isChangingService}
        />
      ) : null}
    </div>
  );
}
