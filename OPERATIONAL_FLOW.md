# Operational Flow (Single Region)

This document describes the intended end-to-end operational handoffs in this system.

## Roles and Ownership

- **Field Agent**
  - Owns crop creation and farm inspections.
  - Advances crop batches up to **READY_FOR_HARVEST / PROCESSED / READY_FOR_PACKAGING** (depending on your operational policy).
  - Must not set shipment/warehouse statuses.

- **Procurement Officer**
  - Selects a **destination warehouse** for a crop batch.
  - Assigns the batch to a **transport coordinator**.

- **Transport Coordinator**
  - Schedules transport tasks (driver + vehicle + pickup/delivery).
  - Moves transport through **SCHEDULED → IN_TRANSIT → DELIVERED**.
  - Delivery is not warehouse receipt.

- **Transport Driver**
  - Confirms **pickup** (QR scan) to start **IN_TRANSIT**.
  - Confirms **delivery** (QR scan) to mark **DELIVERED**.

- **Warehouse Manager**
  - Confirms **receipt** (QR scan) to set crop batch status to **RECEIVED**.
  - Performs storage actions (e.g. **STORED**).

## Status Handoffs

### CropBatch

Typical flow:

- Field Agent: `PLANTED → ... → HARVESTED → PROCESSED → READY_FOR_PACKAGING`
- Procurement: assigns `warehouseId` (destination)
- Coordinator: schedules shipment and sets `SHIPPED`
- Driver: marks transport `IN_TRANSIT` and then `DELIVERED`
- Warehouse: confirms receipt `RECEIVED` and later `STORED`

### TransportTask

- `SCHEDULED` (coordinator created)
- `IN_TRANSIT` (driver pickup confirmed)
- `DELIVERED` (driver delivery confirmed)

## Notifications (Action-Oriented)

This repo currently uses `HarvestNotification` for in-app notifications.

Implemented triggers:

- Field agent updates to `READY_FOR_HARVEST` / `PROCESSED` notify procurement officers.
- Procurement assignment notifies:
  - the chosen transport coordinator
  - destination warehouse managers (by `warehouseId`)
- Coordinator scheduling notifies destination warehouse managers (by `warehouseId`).
- Driver pickup notifies the assigned coordinator.
- Driver delivery notifies:
  - the assigned coordinator
  - destination warehouse managers (by `warehouseId`) to scan/confirm receipt
- Warehouse receipt confirmation notifies:
  - the latest task’s coordinator
  - procurement officers

## Non-goals

- Multiple warehouses by region is intentionally **not** covered here (per current scope).
