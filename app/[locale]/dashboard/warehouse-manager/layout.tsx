import { WarehouseManagerAuthWrapper } from "@/components/warehouse-manager/warehouse-manager-auth-wrapper";
import { WarehouseManagerNavigation } from "@/components/warehouse-manager/warehouse-manager-navigation";

export default function WarehouseManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WarehouseManagerAuthWrapper>
      <WarehouseManagerNavigation>
        {children}
      </WarehouseManagerNavigation>
    </WarehouseManagerAuthWrapper>
  );
}