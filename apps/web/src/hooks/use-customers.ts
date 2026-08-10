"use client";

import { useState } from "react";
import { mockCustomers } from "@/mocks/customers";
import type { Customer } from "@/mocks/types";

// Caché a nivel módulo: las altas hechas en una vista se ven en las demás
// durante la sesión. Este hook entero se reemplaza por TanStack Query +
// packages/api-client cuando el backend esté listo.
let customersCache: Customer[] = [...mockCustomers];

export type NewCustomer = Pick<Customer, "name"> & Partial<Pick<Customer, "phone" | "notes">>;

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(customersCache);

  function addCustomer(data: NewCustomer): Customer {
    const customer: Customer = {
      id: crypto.randomUUID(),
      name: data.name,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
      lastVisitAt: null,
    };
    customersCache = [...customersCache, customer];
    setCustomers(customersCache);
    return customer;
  }

  return { customers, addCustomer };
}
