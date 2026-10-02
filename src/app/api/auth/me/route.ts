import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const isSuper =
    user.role === 'SUPER_ADMIN' ||
    user.email === 'akif@filoyonetim.com' ||
    user.email === 'gencaksoy@outlook.com';

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { fleet: true },
  });

  if (!dbUser || !dbUser.isActive) {
    cookies().delete('filo_auth_session');
    return NextResponse.json(
      { user: null, error: 'Hesabınız yönetici tarafından askıya alınmıştır.' },
      { status: 403 }
    );
  }

  return NextResponse.json({ user });
}
