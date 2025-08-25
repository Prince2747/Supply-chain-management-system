import { Role } from "@/lib/generated/prisma/client";

// Define route access patterns for each role
const ROLE_ACCESS_PATTERNS: Record<Role, string[]> = {
  admin: [
    '/admin',
    '/admin/*',
  ],
  manager: [
    '/dashboard',
    '/reports',
    '/team',
    '/profile',
  ],
  field_agent: [
    '/dashboard',
    '/field-reports',
    '/profile',
  ],
  procurement_officer: [
    '/dashboard',
    '/purchase-orders',
    '/suppliers',
    '/profile',
  ],
  warehouse_manager: [
    '/dashboard',
    '/inventory',
    '/shipments',
    '/profile',
  ],
  transport_driver: [
    '/dashboard',
    '/deliveries',
    '/routes',
    '/profile',
  ],
  transport_coordinator: [
    '/dashboard',
    '/dashboard/*',
    '/dashboard/transport-coordinator',
    '/dashboard/transport-coordinator/*',
    '/profile',
  ],
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/auth',
  '/error',
  '/unauthorized',
  '/',
];

export function hasRouteAccess(role: Role, path: string): boolean {
  // Allow access to public routes
  if (PUBLIC_ROUTES.some(route => path.startsWith(route))) {
    return true;
  }

  // Admin has access to everything
  if (role === 'admin') {
    return true;
  }

  // Check if the path matches any of the allowed patterns for the role
  return ROLE_ACCESS_PATTERNS[role].some(pattern => {
    if (pattern.endsWith('/*')) {
      return path.startsWith(pattern.slice(0, -2));
    }
    return path === pattern;
  });
}
