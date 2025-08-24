'use server'

import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { logActivity } from "@/lib/activity-logger";

export async function checkFieldAgentRole(userId: string) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { role: true }
    });

    return profile?.role === Role.field_agent;
  } catch (error) {
    console.error('Error checking field agent role:', error);
    return false;
  }
}

// Farmer Management Actions
export async function createFarmer(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const isFieldAgent = await checkFieldAgentRole(user.id);
    if (!isFieldAgent) {
      throw new Error('Access denied: Field agent role required');
    }

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const country = formData.get('country') as string;

    if (!name) {
      throw new Error('Name is required');
    }

    // Generate farmer ID
    const farmerCount = await prisma.farmer.count();
    const farmerId = `FAR-${String(farmerCount + 1).padStart(4, '0')}`;

    const farmer = await prisma.farmer.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
        farmerId,
        registeredBy: user.id,
      }
    });

    // Log the activity
    await logActivity({
      userId: user.id,
      action: 'CREATE_FARMER',
      entityType: 'FARMER',
      entityId: farmer.id,
      details: {
        farmerName: name,
        farmerId: farmerId,
        email: email || null
      }
    });

    revalidatePath('/dashboard/field-agent/farmers');
    return { success: true, farmer };
  } catch (error) {
    console.error('Error creating farmer:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getFarmers() {
  try {
    const farmers = await prisma.farmer.findMany({
      where: { isActive: true },
      include: {
        farms: {
          select: {
            id: true,
            name: true,
            farmCode: true,
          }
        },
        _count: {
          select: {
            farms: true,
            cropBatches: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return farmers;
  } catch (error) {
    console.error('Error fetching farmers:', error);
    return [];
  }
}

export async function updateFarmer(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const isFieldAgent = await checkFieldAgentRole(user.id);
    if (!isFieldAgent) {
      throw new Error('Access denied: Field agent role required');
    }

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const country = formData.get('country') as string;

    if (!id || !name) {
      throw new Error('ID and name are required');
    }

    const farmer = await prisma.farmer.update({
      where: { id },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
      }
    });

    revalidatePath('/dashboard/field-agent/farmers');
    return { success: true, farmer };
  } catch (error) {
    console.error('Error updating farmer:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteFarmer(farmerId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const isFieldAgent = await checkFieldAgentRole(user.id);
    if (!isFieldAgent) {
      throw new Error('Access denied: Field agent role required');
    }

    // Soft delete by setting isActive to false
    await prisma.farmer.update({
      where: { id: farmerId },
      data: { isActive: false }
    });

    revalidatePath('/dashboard/field-agent/farmers');
    return { success: true };
  } catch (error) {
    console.error('Error deleting farmer:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Farm Management Actions
export async function createFarm(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const isFieldAgent = await checkFieldAgentRole(user.id);
    if (!isFieldAgent) {
      throw new Error('Access denied: Field agent role required');
    }

    const name = formData.get('name') as string;
    const farmerId = formData.get('farmerId') as string;
    const location = formData.get('location') as string;
    const coordinates = formData.get('coordinates') as string;
    const area = formData.get('area') as string;
    const soilType = formData.get('soilType') as string;

    if (!name || !farmerId) {
      throw new Error('Name and farmer are required');
    }

    // Generate farm code
    const farmCount = await prisma.farm.count();
    const farmCode = `FM-${String(farmCount + 1).padStart(4, '0')}`;

    const farm = await prisma.farm.create({
      data: {
        name,
        farmCode,
        farmerId,
        location: location || null,
        coordinates: coordinates || null,
        area: area ? parseFloat(area) : null,
        soilType: soilType || null,
        registeredBy: user.id,
      },
      include: {
        farmer: {
          select: {
            name: true,
            farmerId: true,
          }
        }
      }
    });

    // Log the activity
    await logActivity({
      userId: user.id,
      action: 'CREATE_FARM',
      entityType: 'FARM',
      entityId: farm.id,
      details: {
        farmName: name,
        farmCode: farmCode,
        farmerName: farm.farmer.name,
        area: area ? parseFloat(area) : null
      }
    });

    revalidatePath('/dashboard/field-agent/farms');
    return { success: true, farm };
  } catch (error) {
    console.error('Error creating farm:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getFarms() {
  try {
    const farms = await prisma.farm.findMany({
      where: { isActive: true },
      include: {
        farmer: {
          select: {
            name: true,
            farmerId: true,
            email: true,
            phone: true,
          }
        },
        _count: {
          select: {
            cropBatches: true,
            inspections: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return farms;
  } catch (error) {
    console.error('Error fetching farms:', error);
    return [];
  }
}

// Crop Batch Management Actions
export async function createCropBatch(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const isFieldAgent = await checkFieldAgentRole(user.id);
    if (!isFieldAgent) {
      throw new Error('Access denied: Field agent role required');
    }

    const cropType = formData.get('cropType') as string;
    const variety = formData.get('variety') as string;
    const farmId = formData.get('farmId') as string;
    const plantingDate = formData.get('plantingDate') as string;
    const expectedHarvest = formData.get('expectedHarvest') as string;
    const quantity = formData.get('quantity') as string;
    const unit = formData.get('unit') as string;
    const notes = formData.get('notes') as string;

    if (!cropType || !farmId) {
      throw new Error('Crop type and farm are required');
    }

    // Get farm to get farmer ID
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: { farmerId: true }
    });

    if (!farm) {
      throw new Error('Farm not found');
    }

    // Generate batch code
    const batchCount = await prisma.cropBatch.count();
    const batchCode = `CB-${new Date().getFullYear()}-${String(batchCount + 1).padStart(3, '0')}`;

    // Generate QR code data
    const qrCode = `${batchCode}-${farmId}-${Date.now()}`;

    const cropBatch = await prisma.cropBatch.create({
      data: {
        batchCode,
        cropType,
        variety: variety || null,
        farmId,
        farmerId: farm.farmerId,
        plantingDate: plantingDate ? new Date(plantingDate) : null,
        expectedHarvest: expectedHarvest ? new Date(expectedHarvest) : null,
        quantity: quantity ? parseFloat(quantity) : null,
        unit: unit || null,
        notes: notes || null,
        qrCode,
        createdBy: user.id,
      },
      include: {
        farm: {
          select: {
            name: true,
            farmCode: true,
          }
        },
        farmer: {
          select: {
            name: true,
            farmerId: true,
          }
        }
      }
    });

    // Log the activity
    await logActivity({
      userId: user.id,
      action: 'CREATE_CROP_BATCH',
      entityType: 'CROP_BATCH',
      entityId: cropBatch.id,
      details: {
        batchCode: batchCode,
        cropType: cropType,
        variety: variety || null,
        farmName: cropBatch.farm.name,
        farmerName: cropBatch.farmer.name,
        qrCode: qrCode
      }
    });

    revalidatePath('/dashboard/field-agent/crops');
    return { success: true, cropBatch };
  } catch (error) {
    console.error('Error creating crop batch:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getCropBatches() {
  try {
    const cropBatches = await prisma.cropBatch.findMany({
      include: {
        farm: {
          select: {
            name: true,
            farmCode: true,
          }
        },
        farmer: {
          select: {
            name: true,
            farmerId: true,
          }
        },
        _count: {
          select: {
            notifications: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return cropBatches;
  } catch (error) {
    console.error('Error fetching crop batches:', error);
    return [];
  }
}

export async function updateCropBatchStatus(batchId: string, status: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const isFieldAgent = await checkFieldAgentRole(user.id);
    if (!isFieldAgent) {
      throw new Error('Access denied: Field agent role required');
    }

    const cropBatch = await prisma.cropBatch.update({
      where: { id: batchId },
      data: { 
        status: status as any,
        actualHarvest: status === 'HARVESTED' ? new Date() : undefined,
      }
    });

    revalidatePath('/dashboard/field-agent/crops');
    return { success: true, cropBatch };
  } catch (error) {
    console.error('Error updating crop batch status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Harvest Notification Actions
export async function getHarvestNotifications() {
  try {
    const notifications = await prisma.harvestNotification.findMany({
      include: {
        cropBatch: {
          select: {
            batchCode: true,
            cropType: true,
            status: true,
            farm: {
              select: {
                name: true,
                farmCode: true,
              }
            },
            farmer: {
              select: {
                name: true,
                farmerId: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching harvest notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    await prisma.harvestNotification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    revalidatePath('/dashboard/field-agent/notifications');
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
