"use client";

import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { useAgenda } from "@/hooks/use-agenda";
import { cn } from "@/lib/cn";
import { formatLongDate } from "@/lib/format";

const START_HOUR = 9;
const END_HOUR = 17;
const PX_PER_HOUR = 64;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

function timeToOffset(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return ((h - START_HOUR) * 60 + m) / 60 * PX_PER_HOUR;
}

export function AgendaView() {
  const { week, selectedDay, selectedIndex, setSelectedIndex, appointments } = useAgenda();

  return (
    <div>
      <PageHeader title="Agenda" subtitle={formatLongDate(selectedDay.date)} />

      {/* Strip semanal L–D (mockup pág. 6) */}
      <div className="mb-5 flex justify-between gap-1">
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
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition",
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

      <Card>
        {appointments.length === 0 ? (
          <p className="py-10 text-center text-neutral-400">Sin turnos para este día.</p>
        ) : (
          <div
            className="relative"
            style={{ height: (END_HOUR - START_HOUR) * PX_PER_HOUR }}
          >
            {HOURS.map((h) => (
              <span
                key={h}
                className="absolute left-0 text-xs text-neutral-400"
                style={{ top: (h - START_HOUR) * PX_PER_HOUR - 8 }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
            {appointments.map((a) => (
              <div
                key={a.id}
                className="absolute left-14 right-0 flex items-center justify-between gap-3 overflow-hidden rounded-xl border-l-4 px-3.5 py-2"
                style={{
                  top: timeToOffset(a.startTime),
                  height: Math.max((a.durationMinutes / 60) * PX_PER_HOUR, 44),
                  borderColor: a.color,
                  backgroundColor: `${a.color}14`,
                }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{a.customerName}</p>
                  <p className="truncate text-xs text-neutral-500">{a.serviceName}</p>
                </div>
                <span className="shrink-0 text-xs text-neutral-400">{a.durationMinutes} min</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
