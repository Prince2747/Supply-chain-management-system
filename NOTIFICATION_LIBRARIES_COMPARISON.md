# Notification System - Library Options

## 🎯 Recommended Libraries for Easier Implementation

### Option 1: **Novu** ⭐⭐⭐⭐⭐ (HIGHLY RECOMMENDED)

**What it is:** Complete notification infrastructure platform with React components

**Pros:**
- ✅ Drop-in React components (bell icon, notification center)
- ✅ Multi-channel support (in-app, email, SMS, push) - but we'll use in-app only
- ✅ Built-in notification templates
- ✅ Real-time updates via WebSocket
- ✅ Activity feed component ready
- ✅ Priority & categorization built-in
- ✅ Free tier: 30K notifications/month
- ✅ Self-hosted option available
- ✅ Excellent TypeScript support
- ✅ Notification preferences UI built-in

**Cons:**
- ⚠️ External service (though can self-host)
- ⚠️ Overkill if you only need in-app notifications

**Installation:**
```bash
npm install @novu/node @novu/notification-center
```

**Usage Example:**
```tsx
// Super simple - just wrap your app
import { NovuProvider, PopoverNotificationCenter, NotificationBell } from '@novu/notification-center';

function Navigation() {
  return (
    <NovuProvider 
      subscriberId={user.id} 
      applicationIdentifier="YOUR_APP_ID"
    >
      <PopoverNotificationCenter colorScheme="light">
        {({ unseenCount }) => <NotificationBell unseenCount={unseenCount} />}
      </PopoverNotificationCenter>
    </NovuProvider>
  );
}

// Trigger from server
import { Novu } from '@novu/node';
const novu = new Novu(process.env.NOVU_API_KEY);

await novu.trigger('harvest-ready', {
  to: { subscriberId: userId },
  payload: {
    cropType: 'Coffee',
    farmName: 'Highland Farm',
    batchCode: 'CB-1234'
  }
});
```

**Perfect for:** Production apps that want a professional notification system without building from scratch.

---

### Option 2: **Knock** ⭐⭐⭐⭐

**What it is:** Notification infrastructure for product teams

**Pros:**
- ✅ Beautiful pre-built UI components
- ✅ Real-time updates
- ✅ Notification workflows (no-code)
- ✅ Good free tier (10K notifications/month)
- ✅ Great developer experience

**Cons:**
- ⚠️ More expensive at scale
- ⚠️ External dependency

**Installation:**
```bash
npm install @knocklabs/node @knocklabs/react-notification-feed
```

---

### Option 3: **Supabase Realtime + Custom UI** ⭐⭐⭐⭐ (BEST FOR YOUR CASE)

**What it is:** Use Supabase's built-in real-time features with a lightweight notification library

**Recommendation: Supabase + `react-hot-toast` or `sonner` for toasts**

**Pros:**
- ✅ Already using Supabase
- ✅ No external dependencies
- ✅ Complete control
- ✅ Zero additional cost
- ✅ Simple to understand
- ✅ Use existing Sonner (already in your project!)

**Cons:**
- ⚠️ Need to build UI components (but we can use ShadCN components you already have)

**Implementation:**
```tsx
// Use Supabase Realtime + your existing Dialog/Popover components
// No new libraries needed!
```

---

### Option 4: **MagicBell** ⭐⭐⭐

**What it is:** Notification inbox for web apps

**Pros:**
- ✅ Beautiful embeddable widget
- ✅ Real-time
- ✅ Easy setup

**Cons:**
- ⚠️ Expensive (starts at $250/month)
- ⚠️ Overkill for this use case

---

### Option 5: **WonderPush** ⭐⭐⭐

**What it is:** Push notification service with web SDK

**Pros:**
- ✅ Free tier available
- ✅ Web push notifications

**Cons:**
- ⚠️ More focused on browser push than in-app

---

## 🎯 **My Recommendation for Your Project**

### **Use: Supabase Realtime + Custom Components** 

**Why?**
1. ✅ **Already in your stack** - Zero new services to learn
2. ✅ **You already have Sonner** - Perfect for toast notifications
3. ✅ **You already have ShadCN UI** - Has Dialog, Popover, Badge components
4. ✅ **Free** - No additional costs
5. ✅ **Simple** - Just need to add Supabase Realtime subscription
6. ✅ **Full control** - Customize exactly to your needs

**What you need:**
```bash
# Nothing! You already have everything:
- Supabase (database + realtime)
- Sonner (toast notifications) 
- ShadCN UI (Dialog, Popover, Badge, etc.)
```

---

## 🚀 **Simplified Implementation (No Email, No Preferences)**

Here's the streamlined approach:

### Step 1: Database Schema (Keep it simple)

```prisma
model Notification {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @db.Uuid
  type        NotificationType
  title       String
  message     String
  metadata    Json?
  actionUrl   String?
  priority    NotificationPriority @default(NORMAL)
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@index([userId, isRead])
  @@index([userId, createdAt])
}

enum NotificationType {
  // Field Agent
  HARVEST_READY
  INSPECTION_DUE
  FARM_REGISTERED
  
  // Procurement
  LOW_STOCK_ALERT
  QUALITY_ISSUE
  
  // Warehouse
  BATCH_RECEIVED
  PACKAGING_COMPLETE
  
  // Transport
  TASK_ASSIGNED
  ROUTE_DELAYED
  
  // General
  SYSTEM_ALERT
  GENERAL
}

enum NotificationPriority {
  NORMAL
  HIGH
  URGENT
}
```

### Step 2: Supabase Realtime Hook

```typescript
// hooks/useRealtimeNotifications.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export function useRealtimeNotifications(userId: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to new notifications
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
          const notification = payload.new;
          
          // Increment unread count
          setUnreadCount(prev => prev + 1);
          
          // Show toast for important notifications
          if (notification.priority === 'HIGH' || notification.priority === 'URGENT') {
            toast.info(notification.title, {
              description: notification.message,
              action: notification.actionUrl ? {
                label: 'View',
                onClick: () => window.location.href = notification.actionUrl
              } : undefined,
              duration: notification.priority === 'URGENT' ? 10000 : 5000
            });
          }
        }
      )
      .subscribe();

    // Load initial unread count
    loadUnreadCount();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function loadUnreadCount() {
    const { count } = await supabase
      .from('Notification')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('isRead', false);
    
    setUnreadCount(count || 0);
  }

  return { unreadCount, refreshCount: loadUnreadCount };
}
```

### Step 3: Simple Notification Service

```typescript
// lib/notifications.ts
import { prisma } from '@/lib/prisma';
import { NotificationType, NotificationPriority } from '@prisma/client';

export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata,
  actionUrl,
  priority = 'NORMAL'
}: {
  userId: string | string[];
  type: NotificationType;
  title: string;
  message: string;
  metadata?: any;
  actionUrl?: string;
  priority?: NotificationPriority;
}) {
  const userIds = Array.isArray(userId) ? userId : [userId];
  
  return prisma.notification.createMany({
    data: userIds.map(uid => ({
      userId: uid,
      type,
      title,
      message,
      metadata,
      actionUrl,
      priority
    }))
  });
}

// Notify all users with a specific role
export async function notifyRole(
  role: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: any
) {
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

### Step 4: Use in Your Existing Components

Your existing `NotificationBell` component already has the UI! Just add the realtime hook:

```tsx
// components/field-agent/notification-bell.tsx
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export function NotificationBell({ userId }: { userId: string }) {
  const { unreadCount } = useRealtimeNotifications(userId);
  
  // Rest of your existing code...
  // Just use the unreadCount from the hook!
}
```

---

## 📦 **What to Install (Minimal)**

```bash
# NOTHING! 
# You already have everything you need:
# - Supabase ✅
# - Sonner ✅ 
# - ShadCN UI ✅
```

---

## 🎯 **Final Recommendation**

**Use: Supabase Realtime + Your Existing Components**

**Reason:**
- Simple
- Free
- No new dependencies
- Leverages what you already have
- Easy to maintain
- Real-time updates work perfectly

**If you need more features later**, consider Novu (easy to add later without changing much code).

---

## 📝 **Implementation Checklist**

1. ✅ Add Notification model to Prisma schema
2. ✅ Run migration
3. ✅ Create `lib/notifications.ts` service
4. ✅ Create `hooks/useRealtimeNotifications.ts` 
5. ✅ Add realtime hook to existing NotificationBell
6. ✅ Add notification triggers to your server actions
7. ✅ Done! 🎉

**Time estimate:** 1-2 days (vs 1-2 weeks with email/preferences)
