import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "danger-outline" | "success" | "dark" | "danger-soft";
  size?: "md" | "lg";
  fullWidth?: boolean;
};

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-white shadow-button hover:brightness-110",
  secondary: "bg-secondary text-white shadow-button-secondary hover:brightness-110",
  outline: "bg-white text-neutral-700 border border-neutral-200 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-700",
  "danger-outline": "bg-white text-secondary border border-secondary dark:bg-neutral-900",
  success: "bg-success text-white shadow-button hover:brightness-110",
  dark: "bg-neutral-900 text-white shadow-button hover:brightness-110 dark:bg-neutral-700",
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
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-150 active:scale-[0.97] active:brightness-95 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
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
