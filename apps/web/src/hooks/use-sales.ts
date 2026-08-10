"use client";

import { useState } from "react";
import { mockSales } from "@/mocks/sales";
import { isSameDay, isWithinLastDays } from "@/lib/format";
import type { Sale } from "@/mocks/types";

// Mismo patrón que use-customers: caché en módulo hasta conectar el API.
let salesCache: Sale[] = [...mockSales];

export type SalesFilter = "today" | "week" | "month";

export type NewSale = Pick<Sale, "customerName" | "serviceNames" | "paymentMethod" | "total">;

export function useSales(filter: SalesFilter = "today") {
  const [sales, setSales] = useState<Sale[]>(salesCache);

  const now = new Date();
  const filtered = sales
    .filter((s) =>
      filter === "today"
        ? isSameDay(s.createdAt, now)
        : filter === "week"
          ? isWithinLastDays(s.createdAt, 7, now)
          : isWithinLastDays(s.createdAt, 30, now),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function addSale(data: NewSale): Sale {
    const sale: Sale = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data };
    salesCache = [...salesCache, sale];
    setSales(salesCache);
    return sale;
  }

  return { sales: filtered, addSale };
}
