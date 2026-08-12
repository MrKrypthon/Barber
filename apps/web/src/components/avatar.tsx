import { cn } from "@/lib/cn";

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    // object-cover: la imagen ya viene recortada a cuadrado (resizeImageToDataUrl),
    // pero cover evita deformarla si algún logo viejo no lo está.
    return (
      <img
        src={src}
        alt={name}
        className={cn("h-10 w-10 shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white",
        className,
      )}
    >
      {initials}
    </div>
  );
}
