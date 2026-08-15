import { EmployeeFormView } from "@/modules/settings/employee-form-view";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeFormView employeeId={id} />;
}
