# Notification System Design & Implementation Guide

## 🎯 Overview

This document outlines a comprehensive notification system for the Supply Chain Management System that supports multi-role, real-time notifications across all user types.

## 📋 Current State vs Proposed

### Current State
- **Model**: `HarvestNotification` (limited to crop batches)
- **Scope**: Field agents only
- **Delivery**: Manual page refresh required
- **Types**: 5 types (HARVEST_READY, INSPECTION_DUE, PEST_ALERT, WEATHER_WARNING, GENERAL)
- **Real-time**: ❌ No
- **Multi-role**: ❌ No

### Proposed State
- **Model**: Unified `Notification` model for all roles
- **Scope**: All roles (Admin, Manager, Field Agent, Procurement Officer, Warehouse Manager, Transport Coordinator, Transport Driver)
- **Delivery**: Real-time with fallback to polling
- **Types**: Extensible notification types per role
- **Real-time**: ✅ Yes (Supabase Realtime)
- **Multi-role**: ✅ Yes

---

## 🏗️ Architecture Design

### 1. Database Schema (Prisma)

```prisma
model Notification {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @db.Uuid  // Recipient
  type        NotificationType
  category    NotificationCategory @default(GENERAL)
  title       String
  message     String
  metadata    Json?    // Flexible data: { cropBatchId, farmId, taskId, etc. }
  actionUrl   String?  // Deep link to relevant page
  priority    NotificationPriority @default(NORMAL)
  isRead      Boolean  @default(false)
  readAt      DateTime?
  createdAt   DateTime @default(now())
  createdBy   String?  @db.Uuid  // Who triggered it (optional)
  expiresAt   DateTime?  // For time-sensitive notifications
  
  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@index([type])
}

enum NotificationType {
  // Field Agent
  HARVEST_READY
  INSPECTION_DUE
  PEST_ALERT
  WEATHER_WARNING
  FARM_REGISTERED
  CROP_BATCH_CREATED
  
  // Procurement Officer
  LOW_STOCK_ALERT
  QUALITY_ISSUE
  PURCHASE_REQUIRED
  SUPPLIER_UPDATE
  
  // Warehouse Manager
  SHIPMENT_ARRIVING
  STORAGE_FULL
  BATCH_RECEIVED
  PACKAGING_COMPLETE
  QUALITY_CHECK_NEEDED
  
  // Transport Coordinator
  TRANSPORT_SCHEDULED
  DRIVER_ASSIGNED
  ROUTE_DELAYED
  VEHICLE_ISSUE
  
  // Transport Driver
  TASK_ASSIGNED
  ROUTE_UPDATED
  PICKUP_READY
  DELIVERY_CONFIRMED
  
  // Admin
  USER_REGISTERED
  SYSTEM_ALERT
  SECURITY_ALERT
  WAREHOUSE_CREATED
  
  // General
  GENERAL
  ANNOUNCEMENT
  REMINDER
}

enum NotificationCategory {
  CROP_MANAGEMENT
  WAREHOUSE_OPERATIONS
  TRANSPORT_LOGISTICS
  PROCUREMENT
  SYSTEM
  SECURITY
  GENERAL
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

### 2. Real-Time Delivery Options

#### Option A: **Supabase Realtime** (Recommended)
**Pros:**
- ✅ Already using Supabase
- ✅ Built-in WebSocket support
- ✅ No additional infrastructure
- ✅ Automatic reconnection
- ✅ Scales automatically

**Implementation:**
```typescript
// lib/notifications/realtime.ts
import { createClient } from '@/utils/supabase/client';

export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'Notification',
        filter: `userId=eq.${userId}`
      },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

#### Option B: **Server-Sent Events (SSE)**
**Pros:**
- ✅ Simpler than WebSockets
- ✅ Auto-reconnect built-in
- ✅ HTTP-based (firewall friendly)

**Cons:**
- ❌ Unidirectional (server → client only)
- ❌ Requires custom endpoint

#### Option C: **Polling** (Fallback)
**Pros:**
- ✅ Works everywhere
- ✅ Simple to implement

**Cons:**
- ❌ Higher latency
- ❌ More server load

**Implementation:**
```typescript
// Use as fallback when WebSocket fails
setInterval(async () => {
  const newNotifications = await fetchUnreadNotifications();
  if (newNotifications.length > 0) {
    updateNotificationState(newNotifications);
  }
}, 30000); // Poll every 30 seconds
```

### 3. Notification Creation Service

```typescript
// lib/notifications/service.ts
import { prisma } from '@/lib/prisma';
import { NotificationType, NotificationPriority } from '@/lib/generated/prisma/client';

interface CreateNotificationParams {
  userId: string | string[];  // Support multiple recipients
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  priority?: NotificationPriority;
  createdBy?: string;
  expiresAt?: Date;
}

export async function createNotification(params: CreateNotificationParams) {
  const {
    userId,
    type,
    title,
    message,
    metadata,
    actionUrl,
    priority = 'NORMAL',
    createdBy,
    expiresAt
  } = params;

  // Support sending to multiple users
  const userIds = Array.isArray(userId) ? userId : [userId];
  
  const notifications = await prisma.notification.createMany({
    data: userIds.map(uid => ({
      userId: uid,
      type,
      category: getCategoryFromType(type),
      title,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
      actionUrl,
      priority,
      createdBy,
      expiresAt
    }))
  });

  return notifications;
}

// Helper to categorize notifications
function getCategoryFromType(type: NotificationType) {
  const mapping: Record<string, string> = {
    HARVEST_READY: 'CROP_MANAGEMENT',
    BATCH_RECEIVED: 'WAREHOUSE_OPERATIONS',
    TRANSPORT_SCHEDULED: 'TRANSPORT_LOGISTICS',
    LOW_STOCK_ALERT: 'PROCUREMENT',
    // ... etc
  };
  return mapping[type] || 'GENERAL';
}

// Bulk notification for role-based alerts
export async function notifyRole(
  role: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, any>
) {
  // Get all active users with this role
  const users = await prisma.profile.findMany({
    where: { role, isActive: true },
    select: { userId: true }
  });

  if (users.length === 0) return;

  return createNotification({
    userId: users.map(u => u.userId),
    type,
    title,
    message,
    metadata
  });
}
```

### 4. Notification Triggers

Create server actions that automatically send notifications:

```typescript
// Example: When crop status changes to READY_FOR_HARVEST
export async function updateCropStatus(batchId: string, newStatus: string, notes: string) {
  // ... existing update logic ...

  if (newStatus === 'READY_FOR_HARVEST') {
    const cropBatch = await prisma.cropBatch.findUnique({
      where: { id: batchId },
      include: { farm: true, farmer: true }
    });

    // Notify field agent who created it
    await createNotification({
      userId: cropBatch.createdBy,
      type: 'HARVEST_READY',
      title: 'Crop Ready for Harvest',
      message: `Crop batch ${cropBatch.batchCode} (${cropBatch.cropType}) is ready for harvest at ${cropBatch.farm.name}`,
      metadata: { cropBatchId: batchId, farmId: cropBatch.farmId },
      actionUrl: `/dashboard/field-agent/crops?batch=${batchId}`,
      priority: 'HIGH'
    });

    // Notify all procurement officers
    await notifyRole(
      'procurement_officer',
      'HARVEST_READY',
      'New Harvest Ready',
      `Crop batch ${cropBatch.batchCode} is ready for procurement review`,
      { cropBatchId: batchId }
    );
  }

  // ... rest of logic ...
}
```

### 5. Client Component (React Hook)

```typescript
// hooks/useNotifications.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscribeToNotifications } from '@/lib/notifications/realtime';
import { toast } from 'sonner';

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [userId]);

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToNotifications(userId, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast for high priority
      if (newNotification.priority === 'HIGH' || newNotification.priority === 'URGENT') {
        toast.info(newNotification.title, {
          description: newNotification.message,
          action: newNotification.actionUrl ? {
            label: 'View',
            onClick: () => window.location.href = newNotification.actionUrl
          } : undefined
        });
      }
    });

    setIsConnected(true);

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [userId]);

  const loadNotifications = useCallback(async () => {
    const response = await fetch('/api/notifications');
    const data = await response.json();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    loadNotifications,
    markAsRead,
    markAllAsRead
  };
}
```

### 6. Universal Notification Bell Component

```typescript
// components/notifications/notification-bell.tsx
'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function NotificationBell({ userId }: { userId: string }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-96 overflow-y-auto">
        {/* Notification list */}
      </PopoverContent>
    </Popover>
  );
}
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
1. ✅ Update Prisma schema with new Notification model
2. ✅ Run migration
3. ✅ Create notification service functions
4. ✅ Build API routes

### Phase 2: Real-Time (Week 2)
1. ✅ Implement Supabase Realtime subscription
2. ✅ Create useNotifications hook
3. ✅ Build universal NotificationBell component
4. ✅ Add to navigation for all roles

### Phase 3: Triggers (Week 3)
1. ✅ Add notification triggers to crop status changes
2. ✅ Add triggers for transport tasks
3. ✅ Add triggers for warehouse operations
4. ✅ Add triggers for procurement alerts

### Phase 4: Enhancements (Week 4)
1. ✅ Email notifications (via Resend/SendGrid)
2. ✅ In-app notification center page
3. ✅ Notification preferences/settings
4. ✅ Notification history & archiving

---

## 📊 Notification Examples by Role

### Field Agent
- "New farm inspection due for Highland Coffee Farm"
- "Crop batch CB-1234 is ready for harvest"
- "Weather alert: Heavy rain expected in your region"

### Procurement Officer
- "Low stock alert: Coffee inventory below threshold"
- "New harvest batch ready for quality inspection"
- "Supplier XYZ updated pricing"

### Warehouse Manager
- "Incoming shipment arriving tomorrow at 10 AM"
- "Storage capacity at 85% - action required"
- "Batch WB-5678 packaging completed"

### Transport Coordinator
- "Vehicle maintenance due for truck TC-101"
- "Driver reported delay on Route 5"
- "New transport task assigned"

### Transport Driver
- "New delivery task assigned: Pickup at 8 AM"
- "Route updated for Task #1234"
- "Pickup location changed"

---

## 🔧 Configuration & Settings

Users should be able to configure:
- ✅ Which notification types they want
- ✅ Delivery method (in-app, email, both)
- ✅ Quiet hours
- ✅ Priority filtering

```typescript
model NotificationPreference {
  id                String   @id @default(uuid())
  userId            String   @db.Uuid @unique
  emailNotifications Boolean @default(true)
  inAppNotifications Boolean @default(true)
  quietHoursStart   Int?     // Hour (0-23)
  quietHoursEnd     Int?     // Hour (0-23)
  disabledTypes     String[] // Array of NotificationType
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

---

## 📈 Performance Considerations

1. **Indexing**: Add indexes on userId, isRead, createdAt
2. **Pagination**: Load notifications in chunks (20-50 at a time)
3. **Auto-cleanup**: Delete read notifications older than 30 days
4. **Caching**: Cache unread count in Redis (optional)
5. **Rate limiting**: Prevent notification spam

---

## 🔒 Security

1. **Authorization**: Users can only see their own notifications
2. **Validation**: Validate userId matches authenticated user
3. **Sanitization**: Sanitize notification content to prevent XSS
4. **Rate limiting**: Limit notification creation per user

---

## 🎨 UI/UX Best Practices

1. **Grouping**: Group similar notifications
2. **Time grouping**: "Today", "Yesterday", "This Week"
3. **Mark all as read**: Bulk action
4. **Filter by type**: Allow filtering notifications
5. **Deep linking**: Click notification → go to relevant page
6. **Sound/visual**: Optional sound/vibration for urgent notifications
7. **Persistence**: Save scroll position, collapse state

---

## ✅ Recommendation: **Go with Supabase Realtime**

**Why?**
- Already in your stack
- Zero additional cost
- Built-in reconnection
- Scales automatically
- WebSocket-based (low latency)
- Simple integration

This provides a production-ready, scalable notification system for your supply chain management platform!
