export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | string;
  avatar?: string | null;
  fleetId?: string | null;
  fleetName?: string | null;
  fleetCode?: string | null;
  fleetStatus?: string | null;
  fleetExpiresAt?: string | null;
  isPartnership?: boolean;
  partners?: string[];
  features?: Record<string, boolean>;
  maxVehicles?: number;
}

export const DEFAULT_FEATURES: Record<string, boolean> = {
  vehicles: true,
  rentals: true,
  customers: true,
  maintenance: true,
  oilChange: true,
  inspection: true,
  parkingTickets: true,
  faults: true,
  finance: true,
  auditLogs: true,
};

export const COOKIE_NAME = 'filo_auth_session';

export function isSuperAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.role === 'SUPER_ADMIN';
}

export function isUserAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || isSuperAdmin(user);
}

export function canAccessAdminArea(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || isSuperAdmin(user);
}

export function hasFeatureAccess(user: AuthUser | null, featureKey: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (!user.features) return true;
  return user.features[featureKey] !== false;
}
