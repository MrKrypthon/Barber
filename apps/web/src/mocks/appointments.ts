import type { Appointment } from "./types";

// Turnos de la semana, indexados por posición en la semana (0 = lunes ... 6 = domingo).
// Los datos del día actual replican el mockup (pág. 6 de docs/Propuesta.pdf).
// Vendrán del módulo Agenda del backend (v0.2, docs/ROADMAP.md).
const NAVY = "#24406B";
const RED = "#C0392B";

export const mockWeekAppointments: Record<number, Appointment[]> = {
  0: [
    { id: "a-lun-1", customerName: "Laura Gómez", serviceName: "Coloración", startTime: "10:00", durationMinutes: 50, color: RED },
    { id: "a-lun-2", customerName: "Juan Pérez", serviceName: "Corte Clásico", startTime: "12:00", durationMinutes: 30, color: NAVY },
  ],
  1: [],
  2: [
    { id: "a-mie-1", customerName: "Rodrigo Paz", serviceName: "Corte Clásico", startTime: "09:30", durationMinutes: 30, color: NAVY },
    { id: "a-mie-2", customerName: "Nico Fernández", serviceName: "Diseño", startTime: "11:00", durationMinutes: 30, color: RED },
    { id: "a-mie-3", customerName: "Ana Silva", serviceName: "Coloración", startTime: "16:30", durationMinutes: 50, color: RED },
  ],
  3: [
    { id: "a-jue-1", customerName: "Ana Silva", serviceName: "Corte Clásico", startTime: "10:00", durationMinutes: 30, color: NAVY },
    { id: "a-jue-2", customerName: "Rodrigo Paz", serviceName: "Barba", startTime: "11:30", durationMinutes: 20, color: RED },
    { id: "a-jue-3", customerName: "Marcos Díaz", serviceName: "Corte + Barba", startTime: "14:30", durationMinutes: 45, color: NAVY },
    { id: "a-jue-4", customerName: "Nico Fernández", serviceName: "Diseño", startTime: "16:00", durationMinutes: 30, color: RED },
  ],
  4: [
    { id: "a-vie-1", customerName: "Juan Pérez", serviceName: "Corte Clásico", startTime: "09:00", durationMinutes: 30, color: NAVY },
    { id: "a-vie-2", customerName: "Marcos Díaz", serviceName: "Afeitado clásico", startTime: "13:00", durationMinutes: 25, color: NAVY },
  ],
  5: [
    { id: "a-sab-1", customerName: "Ana Silva", serviceName: "Coloración", startTime: "10:30", durationMinutes: 50, color: RED },
    { id: "a-sab-2", customerName: "Rodrigo Paz", serviceName: "Corte + Barba", startTime: "12:00", durationMinutes: 45, color: NAVY },
    { id: "a-sab-3", customerName: "Nico Fernández", serviceName: "Diseño", startTime: "15:00", durationMinutes: 30, color: RED },
  ],
  6: [],
};
