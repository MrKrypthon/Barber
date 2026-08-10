import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "danger-outline" | "success" | "dark" | "danger-soft";
  size?: "md" | "lg";
  fullWidth?: boolean;
};

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-white",
  secondary: "bg-secondary text-white",
  outline: "bg-white text-neutral-700 border border-neutral-200",
  "danger-outline": "bg-white text-secondary border border-secondary",
  success: "bg-success text-white",
  dark: "bg-neutral-900 text-white",
  "danger-soft": "bg-secondary-light text-secondary",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:brightness-95 disabled:opacity-50",
        // Touch targets grandes (docs/UI_UX.md §Principios).
        size === "md" ? "min-h-12 px-5 text-base" : "min-h-14 px-6 text-lg",
        VARIANTS[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}
