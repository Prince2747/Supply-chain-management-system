import { TransportCoordinatorAuthWrapper } from "@/components/transport-coordinator/transport-coordinator-auth-wrapper";
import { TransportCoordinatorNavigation } from "@/components/transport-coordinator/transport-coordinator-navigation";

export default function TransportCoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TransportCoordinatorAuthWrapper>
      <TransportCoordinatorNavigation>
        {children}
      </TransportCoordinatorNavigation>
    </TransportCoordinatorAuthWrapper>
  );
}
