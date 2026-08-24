import type { ReactNode } from "react";
import { SuperAdminAuthGate } from "@/components/superadmin-auth-gate";
import { SuperAdminShell } from "@/modules/superadmin/superadmin-shell";

export default function SuperAdminPanelLayout({ children }: { children: ReactNode }) {
  return (
    <SuperAdminAuthGate>
      <SuperAdminShell>{children}</SuperAdminShell>
    </SuperAdminAuthGate>
  );
}
