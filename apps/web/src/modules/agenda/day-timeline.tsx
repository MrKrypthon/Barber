"use client";

import { useEffect, useState } from "react";
import type { Appointment } from "@/mocks/types";

export const START_HOUR = 8;
export const END_HOUR = 19;
export const PX_PER_HOUR = 64;
export const TIMELINE_HEIGHT = (END_HOUR - START_HOUR) * PX_PER_HOUR;
export const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

function timeToOffset(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (((h - START_HOUR) * 60 + m) / 60) * PX_PER_HOUR;
}

function nowOffset(now: Date): number | null {
  const minutesFromStart = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
  if (minutesFromStart < 0 || minutesFromStart > (END_HOUR - START_HOUR) * 60) return null;
  return (minutesFromStart / 60) * PX_PER_HOUR;
}

// "Ahora" se recalcula cada minuto — suficiente para una línea de hora
// actual, sin necesidad de un timer más agresivo.
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

// Columna de horas (gutter), compartida entre la vista de un día y la
// grilla semanal para que las líneas horarias queden alineadas.
export function HourGutter() {
  return (
    <div className="relative w-10 shrink-0" style={{ height: TIMELINE_HEIGHT }}>
      {HOURS.map((h, i) => (
        <span
          key={h}
          className="absolute right-1.5 -translate-y-1/2 text-xs text-neutral-400"
          style={{ top: i * PX_PER_HOUR }}
        >
          {String(h).padStart(2, "0")}
        </span>
      ))}
    </div>
  );
}

// Estilo Google Calendar: líneas de grilla por hora, línea roja de "ahora"
// (solo si el día mostrado es hoy), turnos como chips sólidos con el color
// del servicio.
export function DayTimeline({
  appointments,
  now,
  minWidth,
}: {
  appointments: Appointment[];
  now: Date | null;
  minWidth?: number;
}) {
  const currentOffset = now ? nowOffset(now) : null;

  return (
    <div
      className="relative min-w-0 flex-1"
      style={{ height: TIMELINE_HEIGHT, minWidth }}
    >
      {HOURS.map((h, i) => (
        <div
          key={h}
          className="absolute inset-x-0 border-t border-neutral-100"
          style={{ top: i * PX_PER_HOUR }}
        />
      ))}

      {currentOffset !== null ? (
        <div className="absolute inset-x-0 z-10 flex items-center gap-1" style={{ top: currentOffset }}>
          <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
          <span className="h-px flex-1 bg-secondary" />
        </div>
      ) : null}

      {appointments.map((a) => (
        <div
          key={a.id}
          className="absolute left-0.5 right-0.5 overflow-hidden rounded-md px-2 py-1 text-white transition-all duration-150 hover:z-20 hover:shadow-card-hover"
          style={{
            top: timeToOffset(a.startTime),
            height: Math.max((a.durationMinutes / 60) * PX_PER_HOUR - 2, 20),
            backgroundColor: a.color,
          }}
        >
          <p className="truncate text-[11px] font-semibold leading-tight">{a.customerName}</p>
          <p className="truncate text-[10px] leading-tight text-white/80">{a.serviceName}</p>
        </div>
      ))}
    </div>
  );
}
