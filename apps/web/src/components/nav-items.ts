import type { ComponentType, SVGProps } from "react";
import { AgendaIcon, CashIcon, ConfigIcon, CustomersIcon, DashboardIcon, SalesIcon } from "./icons";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

// Orden: Dashboard, Agenda, Ventas, Clientes, Caja, Config (docs/UI_UX.md §Navegación).
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/agenda", label: "Agenda", icon: AgendaIcon },
  { href: "/ventas", label: "Ventas", icon: SalesIcon },
  { href: "/clientes", label: "Clientes", icon: CustomersIcon },
  { href: "/caja", label: "Caja", icon: CashIcon },
  { href: "/config", label: "Config", icon: ConfigIcon },
];
