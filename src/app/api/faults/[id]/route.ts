import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/faults/[id]
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fault = await prisma.vehicleFault.findUnique({
      where: { id: params.id },
      include: { vehicle: true },
    });

    if (!fault) {
      return NextResponse.json({ error: 'Arıza kaydı bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json(fault);
  } catch (error: any) {
    return NextResponse.json({ error: 'Arıza kaydı alınamadı.' }, { status: 500 });
  }
}

// PUT /api/faults/[id] - Update status, mark as resolved
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getSessionUser();
    const body = await req.json();
    const {
      status, // OPEN, IN_PROGRESS, RESOLVED
      resolutionNotes,
      cost,
      currency,
      severity,
      title,
      description,
    } = body;

    const existing = await prisma.vehicleFault.findUnique({
      where: { id: params.id },
      include: { vehicle: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Arıza kaydı bulunamadı.' }, { status: 404 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (severity !== undefined) updateData.severity = severity;
    if (cost !== undefined) updateData.cost = cost !== null ? parseFloat(cost) : null;
    if (currency !== undefined) updateData.currency = currency;

    if (status === 'RESOLVED') {
      updateData.resolvedDate = new Date();
      updateData.resolutionNotes = resolutionNotes?.trim() || 'Arıza giderildi ve test edildi.';
    } else if (status === 'OPEN' || status === 'IN_PROGRESS') {
      if (body.reopen) {
        updateData.resolvedDate = null;
      }
      if (resolutionNotes !== undefined) {
        updateData.resolutionNotes = resolutionNotes?.trim() || null;
      }
    }

    const updated = await prisma.vehicleFault.update({
      where: { id: params.id },
      data: updateData,
      include: { vehicle: true },
    });

    const isNowResolved = status === 'RESOLVED' && existing.status !== 'RESOLVED';

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: isNowResolved ? 'RESOLVE_FAULT' : 'UPDATE_FAULT',
      target: existing.vehicle.plate,
      description: isNowResolved
        ? `${existing.vehicle.plate} plakalı aracın arızası DÜZELTİLDİ olarak işaretlendi: "${updated.title}" (Çözüm: ${updated.resolutionNotes || 'Tamamlandı'}).`
        : `${existing.vehicle.plate} arıza kaydı güncellendi: "${updated.title}" (Durum: ${updated.status}).`,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Fault PUT error:', error);
    return NextResponse.json({ error: error.message || 'Arıza güncellenemedi.' }, { status: 500 });
  }
}

// DELETE /api/faults/[id] - Staff protected
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getSessionUser();
    if (currentUser && currentUser.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Çalışanların (STAFF) sistemden veri veya arıza kaydı silme yetkisi yoktur!' },
        { status: 403 }
      );
    }

    const existing = await prisma.vehicleFault.findUnique({
      where: { id: params.id },
      include: { vehicle: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Arıza kaydı bulunamadı.' }, { status: 404 });
    }

    await prisma.vehicleFault.delete({
      where: { id: params.id },
    });

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'DELETE_FAULT',
      target: existing.vehicle.plate,
      description: `${existing.vehicle.plate} için arıza kaydı silindi: "${existing.title}".`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Fault DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Arıza kaydı silinemedi.' }, { status: 500 });
  }
}
