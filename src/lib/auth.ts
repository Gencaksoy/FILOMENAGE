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
}

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
    return parseSessionCookie(sessionCookie.value);
  } catch {
    return null;
  }
}

// Alias for backwards & server API route compatibility
export const getSessionUser = getCurrentUser;

export function isUserAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN';
}
