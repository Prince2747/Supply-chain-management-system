import { Role } from "@/lib/generated/prisma/client";

// Define route access patterns for each role
const ROLE_ACCESS_PATTERNS: Record<Role, string[]> = {
  admin: [
    '/admin',
    '/admin/*',
  ],
  manager: [
    '/dashboard',
    '/dashboard/*',
    '/reports',
    '/team',
    '/profile',
  ],
  field_agent: [
    '/dashboard',
    '/dashboard/*',
    '/field-reports',
    '/profile',
  ],
  procurement_officer: [
    '/dashboard',
    '/dashboard/*',
    '/purchase-orders',
    '/suppliers',
    '/profile',
  ],
  warehouse_manager: [
    '/dashboard',
    '/dashboard/*',
    '/inventory',
    '/shipments',
    '/profile',
  ],
  transport_driver: [
    '/dashboard',
    '/dashboard/*',
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
  '/about',
  '/contact',
];

// Helper function to strip locale prefix from path
function stripLocalePrefix(path: string): string {
  // Remove locale prefix like /en/ or /am/
  const localePattern = /^\/(en|am)(\/|$)/;
  return path.replace(localePattern, '/');
}

export function hasRouteAccess(role: Role | null | undefined, path: string): boolean {
  // Strip locale prefix for route matching
  const normalizedPath = stripLocalePrefix(path);
  
  // Allow access to public routes
  if (PUBLIC_ROUTES.some(route => normalizedPath === route || normalizedPath.startsWith(route + '/'))) {
    return true;
  }

  // Admin has access to everything
  if (role === 'admin') {
    return true;
  }

  const patterns = role ? ROLE_ACCESS_PATTERNS[role] : undefined;
  if (!patterns) {
    return false;
  }

  // Check if the path matches any of the allowed patterns for the role
  return patterns.some(pattern => {
    if (pattern.endsWith('/*')) {
      return normalizedPath.startsWith(pattern.slice(0, -2));
    }
    return normalizedPath === pattern;
  });
}
