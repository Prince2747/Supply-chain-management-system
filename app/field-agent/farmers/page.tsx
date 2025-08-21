import { FarmerManagement } from '@/components/field-agent/farmer-management';
import { FieldAgentLayout } from '@/components/field-agent/field-agent-layout';

export default function FarmersPage() {
  return (
    <FieldAgentLayout>
      <FarmerManagement />
    </FieldAgentLayout>
  );
}
