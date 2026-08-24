import type { SubscriptionStatus } from "@barber/types";
import { cn } from "@/lib/cn";

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const isActive = status === "active";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-semibold text-white",
        isActive ? "bg-success" : "bg-secondary",
      )}
    >
      {isActive ? "Activo" : "Suspendido"}
    </span>
  );
}
