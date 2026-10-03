import { cookies } from 'next/headers';
import { prisma } from './prisma';
import {
  AuthUser,
  DEFAULT_FEATURES,
  COOKIE_NAME,
  parseSessionCookie,
} from './auth-client';

export * from './auth-client';

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (!sessionCookie?.value) return null;
    const user = parseSessionCookie(sessionCookie.value);
    if (!user?.id) return null;

    // Askıya alınan veya silinen kullanıcıların anında erişimini denetle
    let dbUser: any = null;
    try {
      dbUser = await prisma.user.findUnique({
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
              maxVehicles: true,
            },
          },
        },
      });
    } catch (dbErr) {
      console.warn('DB lookup failed in getCurrentUser, falling back to cookie session user:', dbErr);
      return user;
    }

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
      maxVehicles: dbUser.fleet?.maxVehicles ?? 20,
    };
  } catch {
    return null;
  }
}

// Alias for backwards & server API route compatibility
export const getSessionUser = getCurrentUser;
