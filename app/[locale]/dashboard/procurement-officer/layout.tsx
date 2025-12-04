import { ProcurementOfficerNavigation } from "@/components/procurement-officer/procurement-officer-navigation";

export default function ProcurementOfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProcurementOfficerNavigation>
      {children}
    </ProcurementOfficerNavigation>
  );
}