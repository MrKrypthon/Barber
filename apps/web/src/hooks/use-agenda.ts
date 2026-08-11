"use client";

import { useState } from "react";
import { mockWeekAppointments } from "@/mocks/appointments";
import type { Appointment } from "@/mocks/types";

export type WeekDay = {
  index: number; // 0 = lunes ... 6 = domingo
  dayLabel: string;
  dayNumber: number;
  date: Date;
  isToday: boolean;
};

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function buildWeek(ref: Date): WeekDay[] {
  const monday = new Date(ref);
  monday.setHours(0, 0, 0, 0);
  // getDay(): 0 = domingo ... 6 = sábado → retroceder hasta el lunes.
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    return {
      index: i,
      dayLabel: DAY_LABELS[i],
      dayNumber: date.getDate(),
      date,
      isToday: date.toDateString() === ref.toDateString(),
    };
  });
}

export function useAgenda() {
  const [week] = useState(() => buildWeek(new Date()));
  const [selectedIndex, setSelectedIndex] = useState(
    () => week.find((d) => d.isToday)?.index ?? 0,
  );

  const selectedDay = week[selectedIndex];
  const appointments: Appointment[] = mockWeekAppointments[selectedIndex] ?? [];

  function appointmentsFor(index: number): Appointment[] {
    return mockWeekAppointments[index] ?? [];
  }

  return { week, selectedDay, selectedIndex, setSelectedIndex, appointments, appointmentsFor };
}
