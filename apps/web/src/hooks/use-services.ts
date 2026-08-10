"use client";

import { useState } from "react";
import { mockServices } from "@/mocks/services";
import type { Service } from "@/mocks/types";

// Mismo patrón que use-customers: caché en módulo hasta conectar el API.
let servicesCache: Service[] = [...mockServices];

export type NewService = Pick<Service, "name" | "price"> &
  Partial<Pick<Service, "durationMinutes" | "color">>;

export function useServices() {
  const [services, setServices] = useState<Service[]>(servicesCache);

  function addService(data: NewService): Service {
    const service: Service = { id: crypto.randomUUID(), active: true, ...data };
    servicesCache = [...servicesCache, service];
    setServices(servicesCache);
    return service;
  }

  return { services, addService };
}
