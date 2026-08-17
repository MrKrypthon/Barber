import { cn } from "@/lib/cn";

// Igual criterio que Avatar (foto o iniciales), pero cuadrada — así el
// grid de Inventario se ve como una vidriera de tienda en línea, no como
// una lista de contactos.
export function ProductPhoto({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return <img src={src} alt={name} className={cn("object-cover", className)} />;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-neutral-100 text-2xl font-semibold text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600",
        className,
      )}
    >
      {name.trim().slice(0, 1).toUpperCase() || "?"}
    </div>
  );
}
