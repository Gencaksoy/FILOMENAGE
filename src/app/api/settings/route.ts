import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'settings.json');

const defaultSettings: Record<string, string> = {
  company_name: 'Belgrad Filo & Rent a Car',
  company_phone: '+381 11 123 4567',
  company_email: 'operasyon@belgradfilo.com',
  default_currency: 'EUR',
  maintenance_interval_months: '1',
  inspection_interval_years: '1',
  warn_days_yellow: '7',
  warn_days_orange: '3',
};

function readSettings(): Record<string, string> {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const content = fs.readFileSync(settingsFilePath, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(content) };
    }
  } catch (e) {
    console.error('Settings read error:', e);
  }
  return defaultSettings;
}

function writeSettings(data: Record<string, string>) {
  try {
    fs.writeFileSync(settingsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Settings write error:', e);
  }
}

export async function GET() {
  try {
    const settings = readSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Ayarlar alınamadı.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const current = readSettings();
    const updated = { ...current, ...body };

    writeSettings(updated);

    await logAudit({
      userName: 'Yönetici',
      action: 'UPDATE_SETTINGS',
      target: 'Sistem Parametreleri',
      description: 'Sistem parametreleri güncellendi.',
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Ayarlar güncellenemedi.' }, { status: 500 });
  }
}
