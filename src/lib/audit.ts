import { prisma } from './prisma';

interface LogAuditParams {
  userName?: string;
  userRole?: string | null;
  action: string;
  target?: string | null; // e.g. "BG 890-CD", "Nikola Petrović"
  description: string;
  fleetId?: string | null;
  userId?: string | null;
  entityType?: string;
  entityId?: string | null;
  changedField?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
}

export async function logAudit(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userName: params.userName || 'Yönetici',
        userRole: params.userRole || null,
        action: params.action,
        target: params.target || null,
        description: params.description,
        fleetId: params.fleetId || null,
      },
    });
  } catch (err) {
    console.error('Audit log kaydedilemedi:', err);
    return null;
  }
}
