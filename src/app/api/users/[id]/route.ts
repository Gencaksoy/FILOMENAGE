import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' }, { status: 403 });
    }

    const isSuper =
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.email === 'akif@filoyonetim.com' ||
      currentUser.email === 'gencaksoy@outlook.com';
    const { id } = params;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    // Normal yöneticiler süper yöneticiye dokunamaz
    if (
      !isSuper &&
      (targetUser.role === 'SUPER_ADMIN' ||
        targetUser.email === 'akif@filoyonetim.com' ||
        targetUser.email === 'gencaksoy@outlook.com')
    ) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
    }

    // Başka filonun kullanıcısını düzenleyemez (Süper admin hariç)
    if (!isSuper && currentUser.fleetId && targetUser.fleetId !== currentUser.fleetId) {
      return NextResponse.json({ error: 'Bu kullanıcıyı düzenleme yetkiniz yok.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role, isActive, password, fleetId } = body;

    const updateData: any = {};
    if (typeof name === 'string' && name.trim()) updateData.name = name.trim();
    if (typeof email === 'string' && email.trim()) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== targetUser.email) {
        const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existing) {
          return NextResponse.json({ error: 'Bu e-posta adresi zaten kullanımda.' }, { status: 400 });
        }
        updateData.email = cleanEmail;
      }
    }
    if (
      typeof role === 'string' &&
      (role === 'ADMIN' || role === 'STAFF' || (isSuper && role === 'SUPER_ADMIN'))
    ) {
      updateData.role = role;
    }
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    if (typeof password === 'string' && password.trim().length >= 6) {
      if (!isSuper && targetUser.id !== currentUser.id) {
        return NextResponse.json(
          { error: 'Süper yönetici olmayan kullanıcılar yalnızca kendi şifrelerini değiştirebilirler.' },
          { status: 403 }
        );
      }
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }
    if (isSuper && fleetId !== undefined) {
      updateData.fleetId = fleetId || null;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        fleetId: true,
        createdAt: true,
      },
    });

    let actionDesc = `${targetUser.name} kullanıcısının bilgileri güncellendi.`;
    if (typeof isActive === 'boolean' && isActive !== targetUser.isActive) {
      actionDesc = isActive
        ? `${targetUser.name} kullanıcısının askısı kaldırıldı (Aktif edildi).`
        : `${targetUser.name} kullanıcısı askıya alındı (Girişi engellendi).`;
    } else if (password) {
      actionDesc = `${targetUser.name} kullanıcısının şifresi sıfırlandı.`;
    }

    await prisma.auditLog.create({
      data: {
        userName: currentUser.name,
        userRole: currentUser.role,
        action:
          typeof isActive === 'boolean'
            ? isActive
              ? 'ACTIVATE_USER'
              : 'SUSPEND_USER'
            : 'UPDATE_USER',
        target: targetUser.name,
        description: actionDesc,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('User PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Kullanıcı güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' }, { status: 403 });
    }

    const isSuper =
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.email === 'akif@filoyonetim.com' ||
      currentUser.email === 'gencaksoy@outlook.com';
    const { id } = params;

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    // Normal kullanıcılar süper yöneticiyi silemez veya sorgulayamaz (yokmuş gibi davran)
    if (
      !isSuper &&
      (userToDelete.role === 'SUPER_ADMIN' ||
        userToDelete.email === 'akif@filoyonetim.com' ||
        userToDelete.email === 'gencaksoy@outlook.com')
    ) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    // Aktif oturumdaki kullanıcının kendini silmesini engelle
    if (userToDelete.id === currentUser.id) {
      return NextResponse.json(
        { error: 'Aktif oturum açmış kullanıcı silinemez.' },
        { status: 400 }
      );
    }

    // Filo yöneticisi başka filonun kullanıcısını silemez
    if (!isSuper && currentUser.fleetId && userToDelete.fleetId !== currentUser.fleetId) {
      return NextResponse.json({ error: 'Bu kullanıcıyı silme yetkiniz yok.' }, { status: 403 });
    }

    // 1. Kullanıcıyı ArchivedRecord tablosuna aktar
    await prisma.archivedRecord.create({
      data: {
        tableName: 'User',
        recordId: userToDelete.id,
        title: `${userToDelete.name} (${userToDelete.email})`,
        data: JSON.stringify(userToDelete),
        fleetId: userToDelete.fleetId,
        deletedBy: currentUser.name,
        reason: 'Kullanıcı silindi ve arşive aktarıldı.',
      },
    });

    // 2. Ana tablodan sil
    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'DELETE_USER',
        target: userToDelete.name,
        description: `Kullanıcı silindi ve arşive aktarıldı: ${userToDelete.name} (${userToDelete.email})`,
      },
    });

    return NextResponse.json({ success: true, message: 'Kullanıcı başarıyla arşive aktarılarak silindi.' });
  } catch (error) {
    console.error('User DELETE error:', error);
    return NextResponse.json({ error: 'Kullanıcı silinemedi.' }, { status: 500 });
  }
}
