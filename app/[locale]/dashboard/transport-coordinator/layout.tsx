import { TransportCoordinatorNavigation } from "@/components/transport-coordinator/transport-coordinator-navigation";

export default function TransportCoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TransportCoordinatorNavigation>
      {children}
    </TransportCoordinatorNavigation>
  );
}
