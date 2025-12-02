import { TransportDriverAuthWrapper } from "@/components/transport-driver/transport-driver-auth-wrapper";
import { TransportDriverNavigation } from "@/components/transport-driver/transport-driver-navigation";

export default function TransportDriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TransportDriverAuthWrapper>
      <TransportDriverNavigation>
        {children}
      </TransportDriverNavigation>
    </TransportDriverAuthWrapper>
  );
}
