import { cn } from "@/lib/cn";

// Píldora seleccionable: duraciones, filtros de ventas, métodos de pago.
export function Chip({
  selected,
  className,
  children,
  onClick,
}: {
  selected?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "min-h-11 rounded-xl px-4 text-sm font-semibold transition",
        selected
          ? "bg-primary text-white"
          : "border border-neutral-200 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
        className,
      )}
    >
      {children}
    </button>
  );
}
