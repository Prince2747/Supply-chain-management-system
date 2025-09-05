import { getTransportReports } from "../actions";
import { TransportReportsClient } from "@/components/transport-coordinator/transport-reports-client";

export default async function ReportsPage() {
  const reports = await getTransportReports();

  return <TransportReportsClient initialReports={reports} />;
}
