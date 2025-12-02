'use server';

import { revalidatePath } from 'next/cache';

export async function updatePackagingStatus(batchId: string, status: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/warehouse/packaging/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ batchId, status }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to update packaging status' };
    }

    revalidatePath('/dashboard/warehouse-manager/packaging');
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error updating packaging status:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function verifyBatch(batchCode: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/warehouse/scanner/verify-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ batchCode }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to verify batch' };
    }

    return { success: true, batch: data.batch };
  } catch (error) {
    console.error('Error verifying batch:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function confirmBatchReceipt(batchId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/warehouse/scanner/confirm-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ batchId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to confirm batch receipt' };
    }

    revalidatePath('/dashboard/warehouse-manager/scanner');
    revalidatePath('/dashboard/warehouse-manager/storage');
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error confirming batch receipt:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function updateStorageStatus(batchId: string, storageLocation?: string, notes?: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/warehouse/storage/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ batchId, storageLocation, notes }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to update storage status' };
    }

    revalidatePath('/dashboard/warehouse-manager/storage');
    revalidatePath('/dashboard/warehouse-manager');
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error updating storage status:', error);
    return { error: 'An unexpected error occurred' };
  }
}