import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { StockRequirementsClient } from "@/components/procurement-officer/stock-requirements-client";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { getStockRequirementsFromDb } from "../actions";

export default async function StockRequirementsPage() {
  const t = await getTranslations("procurementOfficer.stockRequirements");
  const locale = await getLocale();
  const allowedCropTypes = [
    'Haricot Bean',
    'Faba Bean',
    'Chickpea',
    'Red Pea',
    'Lentil',
    'Soybean',
    'Vetch',
    'Niger Seed (Noug)',
    'Sesame',
    'Groundnut',
  ] as const;
  // Get current user authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const currentProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true, name: true }
  });

  if (!currentProfile || !['procurement_officer', 'admin', 'manager'].includes(currentProfile.role)) {
    redirect(`/${locale}/unauthorized`);
  }

  // Get crop types and current stock levels
  const cropStats = await prisma.cropBatch.groupBy({
    by: ['cropType'],
    _sum: {
      quantity: true
    },
    _count: {
      id: true
    },
    where: {
      status: {
        in: ['PROCESSED', 'RECEIVED', 'STORED'] // Available stock (include newly received)
      }
    }
  });

  // Get all unique crop types from the system
  const allCropTypes = await prisma.cropBatch.findMany({
    select: {
      cropType: true,
      unit: true
    },
    distinct: ['cropType']
  });

  const dbRequirements = await getStockRequirementsFromDb();
  const requirementByCrop = new Map(dbRequirements.map(r => [r.cropType, r] as const));

  const cropTypesFromDb = dbRequirements.map((r) => ({ cropType: r.cropType, unit: r.unit }));
  const baseList = allowedCropTypes.map((cropType) => ({ cropType, unit: 'kg' as string | null }));
  const allCrops = [...baseList, ...allCropTypes, ...cropTypesFromDb]
    .reduce((acc, item) => {
      if (!acc.some((x) => x.cropType === item.cropType)) acc.push(item);
      return acc;
    }, [] as Array<{ cropType: string; unit: string | null }>);

  // Build a list of crop types + current stock + DB-backed min stock.
  const allRequirements = allCrops
    .map((crop) => {
      const actualStock = cropStats.find((stat) => stat.cropType === crop.cropType);
      const currentStock = actualStock?._sum?.quantity || 0;
      const batchCount = actualStock?._count?.id || 0;

      const req = requirementByCrop.get(crop.cropType);
      const minStock = req?.minStock ?? 0;
      const targetQuantity = req?.targetQuantity ?? 0;
      const unit = req?.unit || crop.unit || 'kg';

      const status =
        !minStock || minStock <= 0
          ? ('no_requirement' as const)
          : currentStock >= minStock
            ? ('sufficient' as const)
            : ('low' as const);

      return {
        cropType: crop.cropType,
        minStock,
        targetQuantity,
        unit,
        currentStock,
        batchCount,
        status,
      };
    })
    .sort((a, b) => a.cropType.localeCompare(b.cropType));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* Stock Requirements Management */}
      <StockRequirementsClient requirements={allRequirements} />
    </div>
  );
}