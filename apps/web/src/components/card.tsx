import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-5 shadow-card transition-shadow duration-200 dark:bg-neutral-900 dark:shadow-none dark:ring-1 dark:ring-neutral-800",
        className,
      )}
      {...props}
    />
  );
}
