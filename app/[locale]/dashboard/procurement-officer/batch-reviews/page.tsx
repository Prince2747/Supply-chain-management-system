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
import { createNotification } from "@/lib/notifications/unified-actions";
import { NotificationCategory, NotificationType } from "@/lib/generated/prisma";

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

  const approvedProfile = currentProfile;

  async function approveBatch(formData: FormData) {
    "use server";

    const batchId = String(formData.get("batchId") || "");
    if (!batchId) return;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const batch = await prisma.cropBatch.findUnique({
      where: { id: batchId },
      include: {
        farm: true,
        farmer: true,
      },
    });

    if (!batch || batch.status !== "PENDING_APPROVAL") return;

    const moistureContent = Number(formData.get("moistureContent") || 0) || null;
    const grade = String(formData.get("grade") || "").trim() || null;
    const defects = String(formData.get("defects") || "").trim() || null;
    const cleaningStatus = String(formData.get("cleaningStatus") || "").trim() || null;
    const estimatedYield = Number(formData.get("estimatedYield") || 0) || null;
    const estimatedYieldUnit = String(formData.get("estimatedYieldUnit") || "").trim() || null;
    const notes = String(formData.get("notes") || "").trim() || null;

    const parsePhotoList = (value: FormDataEntryValue | null) =>
      String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    const farmerRegion = (batch.farmer as any).region;
    const farmerZone = (batch.farmer as any).zone;
    const farmerWoreda = (batch.farmer as any).woreda;
    const farmerKebele = (batch.farmer as any).kebele;
    const farmRegion = (batch.farm as any).region;
    const farmZone = (batch.farm as any).zone;
    const farmWoreda = (batch.farm as any).woreda;
    const farmKebele = (batch.farm as any).kebele;

    const approvalData = {
      approvedBy: user.id,
      approvedAt: new Date().toISOString(),
      fieldAgentId: batch.createdBy,
      batch: {
        id: batch.id,
        code: batch.batchCode,
        createdAt: batch.createdAt,
      },
      farmer: {
        id: batch.farmerId,
        name: batch.farmer.name,
        contact: batch.farmer.phone,
        location: [farmerRegion, farmerZone, farmerWoreda, farmerKebele]
          .filter(Boolean)
          .join(", "),
      },
      farm: {
        id: batch.farmId,
        name: batch.farm.name,
        location: [farmRegion, farmZone, farmWoreda, farmKebele]
          .filter(Boolean)
          .join(", "),
        sizeHa: (batch.farm as any).area,
      },
      harvest: {
        cropType: batch.cropType,
        variety: batch.variety,
        plantingDate: batch.plantingDate,
        harvestDate: batch.actualHarvest,
        estimatedYield,
        estimatedYieldUnit,
      },
      quality: {
        moistureContent,
        grade,
        defects,
        cleaningStatus,
      },
      photos: {
        crop: parsePhotoList(formData.get("cropPhotos")),
        weighing: parsePhotoList(formData.get("weighingPhotos")),
        batch: parsePhotoList(formData.get("batchPhotos")),
      },
      notes,
    };

    const updateData: any = {
      status: "PROCESSED" as any,
      approvalData,
    };

    await prisma.cropBatch.update({
      where: { id: batchId },
      data: updateData,
    });

    await logActivity({
      userId: user.id,
      action: "APPROVE_BATCH",
      entityType: "CropBatch",
      entityId: batchId,
      details: {
        message: "Approved crop batch (PENDING_APPROVAL -> PROCESSED)",
        role: approvedProfile.role,
        statusFrom: "PENDING_APPROVAL",
        statusTo: "PROCESSED",
        approvalData,
      },
    });

    await createNotification({
      userId: batch.createdBy,
      type: NotificationType.GENERAL,
      category: NotificationCategory.CROP_MANAGEMENT,
      title: "Crop batch approved",
      message: `Batch ${batch.batchCode} has been approved by procurement.`,
      metadata: { batchId: batch.id, batchCode: batch.batchCode },
    });

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
      where: { id: batchId, status: "PENDING_APPROVAL" },
      data: { status: "READY_FOR_HARVEST" as any },
    });

    if (updated.count > 0) {
      await logActivity({
        userId: user.id,
        action: "REJECT_BATCH",
        entityType: "CropBatch",
        entityId: batchId,
        details: {
          message: "Rejected crop batch (PENDING_APPROVAL -> READY_FOR_HARVEST)",
        },
      });
    }

    revalidatePath(`/${locale}/dashboard/procurement-officer/batch-reviews`);
    revalidatePath(`/${locale}/dashboard/procurement-officer`);
  }

  const batches = await prisma.cropBatch.findMany({
    where: { status: "PENDING_APPROVAL" },
    include: {
      farm: { select: { name: true, location: true, area: true, region: true, zone: true, woreda: true, kebele: true } },
      farmer: { select: { name: true, phone: true, region: true, zone: true, woreda: true, kebele: true } },
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
                    <>
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
                          <Badge variant="outline">PENDING APPROVAL</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <form action={rejectBatch}>
                              <input type="hidden" name="batchId" value={b.id} />
                              <Button size="sm" variant="outline">
                                {t("reject")}
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow key={`${b.id}-approval`}>
                        <TableCell colSpan={7} className="bg-gray-50">
                          <details>
                            <summary className="cursor-pointer text-sm font-medium text-gray-700">
                              Approval details
                            </summary>
                            <form action={approveBatch} className="mt-4 grid gap-4">
                              <input type="hidden" name="batchId" value={b.id} />
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="text-xs font-medium">Moisture Content (%)</label>
                                  <input name="moistureContent" type="number" step="0.01" className="mt-1 w-full rounded border px-2 py-1 text-sm" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">Grade</label>
                                  <input name="grade" type="text" className="mt-1 w-full rounded border px-2 py-1 text-sm" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">Defects</label>
                                  <input name="defects" type="text" className="mt-1 w-full rounded border px-2 py-1 text-sm" />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="text-xs font-medium">Cleaning Status</label>
                                  <select name="cleaningStatus" className="mt-1 w-full rounded border px-2 py-1 text-sm">
                                    <option value="">Select</option>
                                    <option value="CLEANED">Cleaned</option>
                                    <option value="UNCLEANED">Uncleaned</option>
                                    <option value="PARTIALLY_CLEANED">Partially cleaned</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-medium">Estimated Yield</label>
                                  <input name="estimatedYield" type="number" step="0.01" className="mt-1 w-full rounded border px-2 py-1 text-sm" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">Yield Unit</label>
                                  <input name="estimatedYieldUnit" type="text" defaultValue="kg" className="mt-1 w-full rounded border px-2 py-1 text-sm" />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-medium">Crop Photos (comma-separated URLs)</label>
                                <textarea name="cropPhotos" rows={2} className="mt-1 w-full rounded border px-2 py-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs font-medium">Weighing Photos (comma-separated URLs)</label>
                                <textarea name="weighingPhotos" rows={2} className="mt-1 w-full rounded border px-2 py-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs font-medium">Batch Photos (comma-separated URLs)</label>
                                <textarea name="batchPhotos" rows={2} className="mt-1 w-full rounded border px-2 py-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs font-medium">Notes</label>
                                <textarea name="notes" rows={2} className="mt-1 w-full rounded border px-2 py-1 text-sm" />
                              </div>
                              <div className="flex justify-end">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  {t("approve")}
                                </Button>
                              </div>
                            </form>
                          </details>
                        </TableCell>
                      </TableRow>
                    </>
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
