import type { ReactNode } from "react";
import { Card } from "./card";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  className,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col gap-1", className)}>
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-2xl font-bold md:text-3xl">{value}</span>
      {hint ? <span className="text-xs text-neutral-400">{hint}</span> : null}
      {children}
    </Card>
  );
}
