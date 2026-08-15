import type { DashboardSummary } from "@/mocks/types";

export function TodayAppointments({
  appointments,
}: {
  appointments: DashboardSummary["todayAppointments"];
}) {
  return (
    <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
      {appointments.map((a) => (
        <li key={`${a.time}-${a.customerName}`} className="flex items-center gap-4 py-3">
          <span className="w-12 text-sm font-semibold text-secondary">{a.time}</span>
          <span className="flex-1 font-medium">{a.customerName}</span>
          <span className="text-sm text-neutral-400 dark:text-neutral-500">{a.serviceName}</span>
        </li>
      ))}
    </ul>
  );
}
