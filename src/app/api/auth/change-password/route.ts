import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { validatePassword } from '@/lib/validation';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Yeni şifre en az 6 karakter olmalıdır.' },
        { status: 400 }
      );
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(' ') },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    const isSuper =
      currentUser.role === 'SUPER_ADMIN';

    // Normal kullanıcılar mevcut şifresini doğrulamalıdır. Süper yöneticiler için opsiyoneldir.
    if (!isSuper || currentPassword) {
      if (currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, dbUser.passwordHash);
        if (!isMatch) {
          return NextResponse.json({ error: 'Mevcut şifrenizi hatalı girdiniz.' }, { status: 400 });
        }
      } else if (!isSuper) {
        return NextResponse.json({ error: 'Mevcut şifrenizi girmelisiniz.' }, { status: 400 });
      }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { passwordHash: newPasswordHash },
    });

    await logAudit({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'CHANGE_PASSWORD',
      target: currentUser.name,
      fleetId: currentUser.fleetId,
      description: `${currentUser.name} kendi giriş şifresini güncelledi.`,
    });

    return NextResponse.json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: error.message || 'Şifre güncellenemedi.' }, { status: 500 });
  }
}
