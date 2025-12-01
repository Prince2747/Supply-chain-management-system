import { QRScanner } from "@/components/transport-driver/qr-scanner";

interface ScannerPageProps {
  searchParams: Promise<{
    taskId?: string;
    action?: "pickup" | "delivery";
  }>;
}

export default async function ScannerPage({ searchParams }: ScannerPageProps) {
  const { taskId, action } = await searchParams;
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">QR Code Scanner</h1>
        <p className="text-muted-foreground mt-2">
          {action === "pickup" 
            ? "Scan the QR code to confirm batch pickup"
            : action === "delivery"
            ? "Scan the QR code to confirm delivery"
            : "Scan QR codes to confirm pickup or delivery"
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
