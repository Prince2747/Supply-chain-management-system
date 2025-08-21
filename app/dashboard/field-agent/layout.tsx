import { FieldAgentAuthWrapper } from "@/components/field-agent/field-agent-auth-wrapper";

export default function FieldAgentFarmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FieldAgentAuthWrapper>{children}</FieldAgentAuthWrapper>;
}
