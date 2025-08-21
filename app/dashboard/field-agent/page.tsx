import { FieldAgentDashboard } from '@/components/dashboard/role-dashboards/field-agent-dashboard';
import { FieldAgentLayout } from '@/components/field-agent/field-agent-layout';

export default function FieldAgentDashboardPage() {
  return (
    <FieldAgentLayout>
      <FieldAgentDashboard />
    </FieldAgentLayout>
  );
}
