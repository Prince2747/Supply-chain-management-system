import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { StockRequirementsClient } from "@/components/procurement-officer/stock-requirements-client";
import { getTranslations } from "next-intl/server";

export default async function StockRequirementsPage() {
  const t = await getTranslations("procurementOfficer.stockRequirements");
  // Get current user authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const currentProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true, name: true }
  });

  if (!currentProfile || currentProfile.role !== 'procurement_officer') {
    redirect('/unauthorized');
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
        in: ['PROCESSED', 'STORED'] // Available stock
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

  // Mock data for stock requirements (in real app, this would be a separate table)
  const mockRequirements = [
    { cropType: 'Wheat', minStock: 1000, unit: 'kg', currentStock: 1500 },
    { cropType: 'Rice', minStock: 800, unit: 'kg', currentStock: 600 },
    { cropType: 'Corn', minStock: 500, unit: 'kg', currentStock: 750 },
    { cropType: 'Barley', minStock: 300, unit: 'kg', currentStock: 200 },
    { cropType: 'Oats', minStock: 400, unit: 'kg', currentStock: 450 },
  ];

  // Merge actual stock data with requirements
  const stockRequirements = mockRequirements.map(req => {
    const actualStock = cropStats.find(stat => stat.cropType === req.cropType);
    const currentStock = actualStock?._sum?.quantity || 0;
    const batchCount = actualStock?._count?.id || 0;
    return {
      ...req,
      currentStock,
      batchCount,
      status: currentStock >= req.minStock ? 'sufficient' as const : 'low' as const
    };
  });

  // Add any crop types that don't have requirements set
  const missingCropTypes = allCropTypes.filter(
    crop => !mockRequirements.find(req => req.cropType === crop.cropType)
  ).map(crop => {
    const actualStock = cropStats.find(stat => stat.cropType === crop.cropType);
    const currentStock = actualStock?._sum?.quantity || 0;
    const batchCount = actualStock?._count?.id || 0;
    return {
      cropType: crop.cropType,
      minStock: 0,
      unit: crop.unit || 'kg',
      currentStock,
      batchCount,
      status: 'no_requirement' as const
    };
  });

  const allRequirements = [...stockRequirements, ...missingCropTypes];

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