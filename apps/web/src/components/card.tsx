import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl bg-white p-5 shadow-card transition-shadow duration-200", className)}>
      {children}
    </div>
  );
}
