"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mockBusiness } from "@/mocks/business";
import { cn } from "@/lib/cn";
import { Avatar } from "./avatar";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-primary md:flex">
      <div className="flex items-center gap-3 px-5 py-6">
        <Avatar name={mockBusiness.name} className="bg-white/15" />
        <span className="text-base font-semibold leading-tight text-white">
          {mockBusiness.name}
        </span>
      </div>
      <nav className="mt-2 flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/5",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
