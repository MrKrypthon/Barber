"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Appointment } from "@/mocks/types";

export const START_HOUR = 8;
export const END_HOUR = 19;
export const PX_PER_HOUR = 64;
export const TIMELINE_HEIGHT = (END_HOUR - START_HOUR) * PX_PER_HOUR;
export const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

// Mantener presionado este tiempo activa el modo arrastre (mismo criterio
// en mouse y touch, vía Pointer Events); un tap/click más corto abre el modal.
const LONG_PRESS_MS = 400;
// Si el puntero se mueve más que esto ANTES de completarse el long-press,
// es un scroll/swipe, no una espera quieta — se cancela.
const MOVE_CANCEL_THRESHOLD_PX = 8;
// El horario se ajusta a pasos de 5 minutos al arrastrar.
const SNAP_MINUTES = 5;

function timeToOffset(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (((h - START_HOUR) * 60 + m) / 60) * PX_PER_HOUR;
}

function offsetToTime(offset: number): string {
  const rawMinutes = (offset / PX_PER_HOUR) * 60;
  const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
  const clamped = Math.max(0, Math.min(snapped, (END_HOUR - START_HOUR) * 60));
  const h = START_HOUR + Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function appointmentHeight(durationMinutes: number): number {
  return Math.max((durationMinutes / 60) * PX_PER_HOUR - 2, 20);
}

// Un turno terminó si su hora de fin (fecha de la columna + startTime +
// duración) ya pasó respecto al reloj real — no depende de qué día se esté
// mirando, así un día completo en el pasado queda todo marcado como pasado.
function isPastAppointment(date: Date, appointment: Appointment, now: Date | null): boolean {
  if (!now) return false;
  const [h, m] = appointment.startTime.split(":").map(Number);
  const start = new Date(date);
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + appointment.durationMinutes * 60_000);
  return end.getTime() <= now.getTime();
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
// del servicio. Un tap/click corto abre el modal; mantener presionado activa
// el modo arrastre (con un pequeño temblor de feedback) para reprogramar el
// horario arrastrando verticalmente, igual en mouse (desktop) que en touch.
export function DayTimeline({
  date,
  appointments,
  now,
  showNowLine,
  minWidth,
  onAppointmentClick,
  onAppointmentReschedule,
}: {
  date: Date;
  appointments: Appointment[];
  now: Date | null;
  showNowLine: boolean;
  minWidth?: number;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAppointmentReschedule?: (appointment: Appointment, newStartTime: string) => void;
}) {
  const currentOffset = showNowLine && now ? nowOffset(now) : null;

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const dragOrigin = useRef({ pointerY: 0, offsetPx: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearLongPressTimer() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>, a: Appointment) {
    // No dejar que el gesto llegue al swipe de cambio de día del contenedor.
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOrigin.current = { pointerY: e.clientY, offsetPx: timeToOffset(a.startTime) };
    clearLongPressTimer();
    longPressTimer.current = setTimeout(() => {
      setDragId(a.id);
      setDragOffsetPx(dragOrigin.current.offsetPx);
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>, a: Appointment) {
    if (dragId === a.id) {
      e.stopPropagation();
      const deltaY = e.clientY - dragOrigin.current.pointerY;
      const maxOffset = TIMELINE_HEIGHT - appointmentHeight(a.durationMinutes);
      setDragOffsetPx(Math.max(0, Math.min(dragOrigin.current.offsetPx + deltaY, maxOffset)));
      return;
    }
    // Todavía esperando el long-press: moverse antes de tiempo es un
    // scroll/swipe, no una espera quieta — se cancela.
    if (Math.abs(e.clientY - dragOrigin.current.pointerY) > MOVE_CANCEL_THRESHOLD_PX) {
      clearLongPressTimer();
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>, a: Appointment) {
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    clearLongPressTimer();

    if (dragId !== a.id) {
      // Se soltó antes de completar el long-press: es un tap/click.
      onAppointmentClick?.(a);
      return;
    }
    setDragId(null);
    const newStartTime = offsetToTime(dragOffsetPx);
    if (newStartTime !== a.startTime) {
      onAppointmentReschedule?.(a, newStartTime);
    }
  }

  function handlePointerCancel() {
    clearLongPressTimer();
    setDragId(null);
  }

  return (
    <div className="relative min-w-0 flex-1" style={{ height: TIMELINE_HEIGHT, minWidth }}>
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

      {appointments.map((a) => {
        const dragging = dragId === a.id;
        const past = !dragging && isPastAppointment(date, a, now);
        return (
          <button
            key={a.id}
            type="button"
            onPointerDown={(e) => handlePointerDown(e, a)}
            onPointerMove={(e) => handlePointerMove(e, a)}
            onPointerUp={(e) => handlePointerUp(e, a)}
            onPointerCancel={handlePointerCancel}
            className={cn(
              "absolute left-0.5 right-0.5 overflow-hidden rounded-md px-2 py-1 text-left text-white",
              dragging
                ? "z-30 animate-wiggle shadow-card-hover"
                : "transition-all duration-150 hover:z-20 hover:shadow-card-hover active:scale-[0.98]",
              past && "opacity-45",
            )}
            style={{
              top: dragging ? dragOffsetPx : timeToOffset(a.startTime),
              height: appointmentHeight(a.durationMinutes),
              backgroundColor: a.color,
              backgroundImage: past
                ? "linear-gradient(to bottom right, transparent calc(50% - 1px), rgba(255,255,255,0.85) 50%, transparent calc(50% + 1px))"
                : undefined,
              touchAction: "none",
            }}
          >
            <p className="truncate text-[11px] font-semibold leading-tight">{a.customerName}</p>
            <p className="truncate text-[10px] leading-tight text-white/80">{a.serviceName}</p>
          </button>
        );
      })}
    </div>
  );
}
