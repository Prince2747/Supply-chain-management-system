import { ProcurementOfficerAuthWrapper } from "@/components/procurement-officer/procurement-officer-auth-wrapper";
import { ProcurementOfficerNavigation } from "@/components/procurement-officer/procurement-officer-navigation";

export default function ProcurementOfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProcurementOfficerAuthWrapper>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="hidden w-64 bg-muted/30 lg:block">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b px-6">
              <h2 className="text-lg font-semibold text-green-700">
                Procurement Officer
              </h2>
            </div>
            <ProcurementOfficerNavigation />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <main className="container mx-auto px-6 py-8">
            {children}
          </main>
        </div>
      </div>
    </ProcurementOfficerAuthWrapper>
  );
}