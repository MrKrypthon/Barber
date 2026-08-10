import { cn } from "@/lib/cn";

// Barras de progreso del flujo Cobrar (3 pasos, color secundario como en el mockup).
export function StepIndicator({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-8 rounded-full",
            i < step ? "bg-secondary" : "bg-neutral-300",
          )}
        />
      ))}
    </div>
  );
}
