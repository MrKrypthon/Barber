"use client";

import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { StatCard } from "@/components/stat-card";
import { useDashboard } from "@/hooks/use-dashboard";
import { formatCurrency, formatLongDate, greeting } from "@/lib/format";
import { mockBusiness } from "@/mocks/business";
import { TodayAppointments } from "./today-appointments";
import { WeekChart } from "./week-chart";

export function DashboardView() {
  const { summary } = useDashboard();
  const now = new Date();

  return (
    <div className="flex flex-col gap-4">
      {/* Header móvil: marca + fecha + avatar (mockup). Desktop: saludo + Cobrar. */}
      <header className="flex items-center justify-between md:hidden">
        <div>
          <h1 className="text-lg font-bold">{mockBusiness.name}</h1>
          <p className="text-sm text-neutral-500">{formatLongDate(now)}</p>
        </div>
        <Avatar name={mockBusiness.name} />
      </header>
      <header className="hidden items-center justify-between md:flex">
        <div>
          <h1 className="text-2xl font-bold">{greeting(now)}</h1>
          <p className="text-sm text-neutral-500">{formatLongDate(now)}</p>
        </div>
        <Link href="/cobrar">
          <Button size="lg">Cobrar</Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard
          className="col-span-2 md:col-span-1"
          label="Ventas del día"
          value={formatCurrency(summary.todaySalesTotal)}
          hint={`${summary.todaySalesCount} cobros`}
        />
        <Link href="/agenda" className="block">
          <StatCard
            label="Turnos hoy"
            value={summary.appointmentsToday}
            hint={summary.nextAppointmentTime ? `Próximo ${summary.nextAppointmentTime}` : undefined}
          />
        </Link>
        <StatCard label="Caja" value={`Efec. ${formatCurrency(summary.cashTotal)}`}>
          <span className="text-xs text-neutral-400">
            Transf. {formatCurrency(summary.transferTotal)}
          </span>
        </StatCard>
      </div>

      <Card>
        <WeekChart week={summary.week} average={summary.weekAverage} />
      </Card>

      {/* Lista de turnos visible en tablet/desktop (mockup tablet). */}
      <Link href="/agenda" className="hidden md:block">
        <Card>
          <TodayAppointments appointments={summary.todayAppointments} />
        </Card>
      </Link>

      <Link href="/cobrar" className="md:hidden">
        <Button size="lg" fullWidth>
          Cobrar
        </Button>
      </Link>
    </div>
  );
}
