"use client";

import { useState } from "react";
import { mockCashMovements, mockCashSummary } from "@/mocks/cash";
import type { CashMovement } from "@/mocks/types";

// Mismo patrón que use-customers: caché en módulo hasta conectar el API.
let movementsCache: CashMovement[] = [...mockCashMovements];

export type NewExpense = { description: string; amount: number };

export function useCash() {
  const [movements, setMovements] = useState<CashMovement[]>(movementsCache);
  const [isClosed, setIsClosed] = useState(false);

  function addExpense(data: NewExpense) {
    const movement: CashMovement = {
      id: crypto.randomUUID(),
      type: "expense",
      amount: data.amount,
      description: data.description,
      paymentMethod: "cash",
      createdAt: new Date().toISOString(),
    };
    movementsCache = [...movementsCache, movement];
    setMovements(movementsCache);
  }

  // El "corte de caja" real se implementa con el módulo Cash del backend;
  // aquí solo se refleja el estado visual.
  function closeCash() {
    setIsClosed(true);
  }

  return { summary: mockCashSummary, movements, isClosed, closeCash, addExpense };
}
