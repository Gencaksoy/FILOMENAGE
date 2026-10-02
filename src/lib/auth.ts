import { cookies } from 'next/headers';
import { prisma } from './prisma';

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
}

const DEFAULT_FEATURES: Record<string, boolean> = {
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

const COOKIE_NAME = 'filo_auth_session';

export function createSessionCookie(user: AuthUser) {
  const data = JSON.stringify(user);
  const encoded = Buffer.from(data, 'utf-8').toString('base64');
  return encoded;
}

export function parseSessionCookie(cookieValue: string): AuthUser | null {
  try {
    const json = Buffer.from(cookieValue, 'base64').toString('utf-8');
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (!sessionCookie?.value) return null;
    const user = parseSessionCookie(sessionCookie.value);
    if (!user?.id) return null;

    // Askıya alınan veya silinen kullanıcıların anında erişimini kes
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        fleetId: true,
        fleet: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            expiresAt: true,
            isPartnership: true,
            partners: true,
            features: true,
          },
        },
      },
    });

    if (!dbUser || !dbUser.isActive) {
      return null;
    }

    let parsedPartners: string[] = [];
    if (dbUser.fleet?.partners) {
      try {
        parsedPartners = JSON.parse(dbUser.fleet.partners);
      } catch {
        parsedPartners = [];
      }
    }

    let parsedFeatures: Record<string, boolean> = { ...DEFAULT_FEATURES };
    if (dbUser.fleet?.features) {
      try {
        parsedFeatures = { ...DEFAULT_FEATURES, ...JSON.parse(dbUser.fleet.features) };
      } catch {
        parsedFeatures = { ...DEFAULT_FEATURES };
      }
    }

    return {
      ...user,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      fleetId: dbUser.fleetId,
      fleetName: dbUser.fleet?.name || user.fleetName || null,
      fleetCode: dbUser.fleet?.code || user.fleetCode || null,
      fleetStatus: dbUser.fleet?.status || null,
      fleetExpiresAt: dbUser.fleet?.expiresAt ? dbUser.fleet.expiresAt.toISOString() : null,
      isPartnership: dbUser.fleet?.isPartnership ?? false,
      partners: parsedPartners,
      features: parsedFeatures,
    };
  } catch {
    return null;
  }
}

// Alias for backwards & server API route compatibility
export const getSessionUser = getCurrentUser;

export function isUserAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN';
}
