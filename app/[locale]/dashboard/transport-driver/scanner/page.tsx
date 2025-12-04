import { QRScanner } from "@/components/transport-driver/qr-scanner";
import { getTranslations } from "next-intl/server";

interface ScannerPageProps {
  searchParams: Promise<{
    taskId?: string;
    action?: "pickup" | "delivery";
  }>;
}

export default async function ScannerPage({ searchParams }: ScannerPageProps) {
  const t = await getTranslations("transportDriver.scanner");
  const { taskId, action } = await searchParams;
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">
          {action === "pickup" 
            ? t("pickupDesc")
            : action === "delivery"
            ? t("deliveryDesc")
            : t("defaultDesc")
          }
        </p>
      </div>

      <QRScanner 
        taskId={taskId}
        action={action}
      />
    </div>
  );
}
