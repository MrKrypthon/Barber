import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "./icons";

export function PageHeader({
  title,
  subtitle,
  action,
  backHref,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  backHref?: string;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Volver"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 active:bg-neutral-200 dark:text-neutral-300 dark:active:bg-neutral-800"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </Link>
        ) : null}
        <div>
          <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
          {subtitle ? <p className="text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </header>
  );
}
