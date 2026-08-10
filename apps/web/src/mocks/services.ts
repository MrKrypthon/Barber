import type { Service } from "./types";

// Paleta ofrecida en el mockup "Nuevo servicio".
export const SERVICE_COLORS = ["#24406B", "#C0392B", "#2E7D32", "#6D4C41", "#5E35B1"];

export const SERVICE_DURATIONS = [15, 30, 45, 60];

export const mockServices: Service[] = [
  { id: "s1", name: "Corte Clásico", price: 8000, active: true, durationMinutes: 30, color: "#24406B" },
  { id: "s2", name: "Barba", price: 5000, active: true, durationMinutes: 20, color: "#C0392B" },
  { id: "s3", name: "Corte + Barba", price: 12000, active: true, durationMinutes: 45, color: "#24406B" },
  { id: "s4", name: "Diseño", price: 6000, active: true, durationMinutes: 30, color: "#C0392B" },
  { id: "s5", name: "Afeitado clásico", price: 6500, active: true, durationMinutes: 25, color: "#24406B" },
  { id: "s6", name: "Coloración", price: 14000, active: true, durationMinutes: 50, color: "#C0392B" },
];
