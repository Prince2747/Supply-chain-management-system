import { SecuritySettingsClient } from '@/components/admin/security-settings-client';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true }
  });

  if (!profile || profile.role !== 'admin') {
    redirect('/unauthorized');
  }

  // Get security settings
  const settingsData = await prisma.securitySettings.findFirst();
  
  // Convert dates to strings for client component
  const settings = settingsData ? {
    ...settingsData,
    createdAt: settingsData.createdAt.toISOString(),
    updatedAt: settingsData.updatedAt.toISOString()
  } : null;

  const t = await getTranslations('admin.settingsPage');

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>
      
      <SecuritySettingsClient initialSettings={settings} />
    </div>
  );
}