import type { ReactNode } from "react";
import { SuperAdminAuthProvider } from "@/hooks/use-superadmin-auth";

export default function SuperAdminRootLayout({ children }: { children: ReactNode }) {
  return <SuperAdminAuthProvider>{children}</SuperAdminAuthProvider>;
}
