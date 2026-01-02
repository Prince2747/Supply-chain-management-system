import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getTranslations, getLocale } from "next-intl/server";
import { logActivity } from "@/lib/activity-logger";

export default async function BatchReviewsPage() {
  const t = await getTranslations("procurementOfficer.batchReviews");
  const locale = await getLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const currentProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true, name: true },
  });

  if (!currentProfile || !["procurement_officer", "admin", "manager"].includes(currentProfile.role)) {
    redirect(`/${locale}/unauthorized`);
  }

  async function approveBatch(formData: FormData) {
    "use server";

    const batchId = String(formData.get("batchId") || "");
    if (!batchId) return;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Only allow approving batches that are actually pending review.
    const updated = await prisma.cropBatch.updateMany({
      where: { id: batchId, status: "HARVESTED" },
      data: { status: "PROCESSED" },
    });

    if (updated.count > 0) {
      await logActivity({
        userId: user.id,
        action: "APPROVE_BATCH",
        entityType: "CropBatch",
        entityId: batchId,
        details: {
          message: "Approved crop batch (HARVESTED -> PROCESSED)",
        },
      });
    }

    revalidatePath(`/${locale}/dashboard/procurement-officer/batch-reviews`);
    revalidatePath(`/${locale}/dashboard/procurement-officer`);
    revalidatePath(`/${locale}/dashboard/procurement-officer/inventory`);
    revalidatePath(`/${locale}/dashboard/procurement-officer/stock-requirements`);
  }

  async function rejectBatch(formData: FormData) {
    "use server";

    const batchId = String(formData.get("batchId") || "");
    if (!batchId) return;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Keep the workflow simple: move back to READY_FOR_HARVEST for rework.
    const updated = await prisma.cropBatch.updateMany({
      where: { id: batchId, status: "HARVESTED" },
      data: { status: "READY_FOR_HARVEST" },
    });

    if (updated.count > 0) {
      await logActivity({
        userId: user.id,
        action: "REJECT_BATCH",
        entityType: "CropBatch",
        entityId: batchId,
        details: {
          message: "Rejected crop batch (HARVESTED -> READY_FOR_HARVEST)",
        },
      });
    }

    revalidatePath(`/${locale}/dashboard/procurement-officer/batch-reviews`);
    revalidatePath(`/${locale}/dashboard/procurement-officer`);
  }

  const batches = await prisma.cropBatch.findMany({
    where: { status: "HARVESTED" },
    include: {
      farm: { select: { name: true, location: true } },
      farmer: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pendingTitle")}</CardTitle>
          <CardDescription>{t("pendingDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("empty")}</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("batchCode")}</TableHead>
                    <TableHead>{t("cropType")}</TableHead>
                    <TableHead>{t("farm")}</TableHead>
                    <TableHead>{t("farmer")}</TableHead>
                    <TableHead>{t("quantity")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono text-sm">{b.batchCode}</TableCell>
                      <TableCell>{b.cropType}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{b.farm.name}</div>
                          {b.farm.location ? (
                            <div className="text-xs text-muted-foreground">{b.farm.location}</div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{b.farmer.name || "-"}</TableCell>
                      <TableCell>
                        {b.quantity ? `${b.quantity} ${b.unit || ""}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">HARVESTED</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <form action={rejectBatch}>
                            <input type="hidden" name="batchId" value={b.id} />
                            <Button size="sm" variant="outline">
                              {t("reject")}
                            </Button>
                          </form>
                          <form action={approveBatch}>
                            <input type="hidden" name="batchId" value={b.id} />
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              {t("approve")}
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href={`/${locale}/dashboard/procurement-officer`}>{t("backToDashboard")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
