import { ServiceFormView } from "@/modules/settings/service-form-view";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ServiceFormView serviceId={id} />;
}
