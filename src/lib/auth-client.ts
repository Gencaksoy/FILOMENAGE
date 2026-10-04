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

function getSessionSecret(): string {
  const envSecret =
    typeof process !== 'undefined' && process.env
      ? process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || process.env.JWT_SECRET
      : undefined;

  return envSecret || 'development-session-secret-change-me';
}

function signSessionPayload(payload: string): string {
  if (typeof window !== 'undefined') {
    return '';
  }

  try {
    const crypto = require('node:crypto');
    return crypto
      .createHmac('sha256', getSessionSecret())
      .update(payload)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  } catch {
    return '';
  }
}

export function createSessionCookie(user: AuthUser) {
  const data = JSON.stringify(user);

  if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
    const payload = Buffer.from(data, 'utf-8').toString('base64');
    const signature = signSessionPayload(payload);
    return signature ? `${payload}.${signature}` : payload;
  }

  return btoa(encodeURIComponent(data));
}

export function parseSessionCookie(cookieValue: string): AuthUser | null {
  try {
    const parts = cookieValue.split('.');
    let payload = cookieValue;
    let signature: string | undefined;

    if (parts.length === 2) {
      payload = parts[0];
      signature = parts[1];
    }

    if (payload && signature) {
      const expectedSignature = signSessionPayload(payload);
      if (expectedSignature && signature !== expectedSignature) {
        return null;
      }
    } else {
      return null;
    }

    let json: string;
    if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
      json = Buffer.from(payload, 'base64').toString('utf-8');
    } else {
      json = decodeURIComponent(atob(payload));
    }
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

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
