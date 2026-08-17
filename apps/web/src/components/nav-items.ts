import type { ComponentType, SVGProps } from "react";
import {
  AgendaIcon,
  CashIcon,
  ConfigIcon,
  CustomersIcon,
  DashboardIcon,
  InventoryIcon,
  SalesIcon,
} from "./icons";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

// Orden: Dashboard, Agenda, Ventas, Clientes, Caja, Inventario, Config.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/agenda", label: "Agenda", icon: AgendaIcon },
  { href: "/ventas", label: "Ventas", icon: SalesIcon },
  { href: "/clientes", label: "Clientes", icon: CustomersIcon },
  { href: "/caja", label: "Caja", icon: CashIcon },
  { href: "/inventario", label: "Inventario", icon: InventoryIcon },
  { href: "/config", label: "Config", icon: ConfigIcon },
];
