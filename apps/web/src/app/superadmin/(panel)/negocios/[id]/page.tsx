import { TenantDetailView } from "@/modules/superadmin/tenant-detail-view";

export default async function SuperAdminTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TenantDetailView tenantId={id} />;
}
