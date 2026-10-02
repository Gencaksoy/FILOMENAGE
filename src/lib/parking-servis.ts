import { prisma } from './prisma';

export interface ParkingServisFine {
  id: string;
  plate: string;
  zone?: string;
  street?: string;
  streetNumber?: string;
  violation?: string;
  price?: string;
  discountDescription?: string;
  paymentDeadline?: string;
  paymentReferenceNumber?: string;
  issuedAt?: string;
  validTo?: string;
  paymentIpsUrl?: string;
  paymentCcUrl?: string;
}

export interface ParkingServisResponse {
  paymentAccountNumber?: string;
  fines: ParkingServisFine[];
  error?: string;
}

// Plakayı Parking Servis'in istediği formata temizler (Örn: "BG 1709-OT" -> "BG1709OT")
export function cleanPlateForParkingServis(plate: string): string {
  if (!plate) return '';
  return plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

// Sırbistan tarih formatını (DD.MM.YYYY HH:mm:ss veya YYYY-MM-DD HH:mm:ss) Date objesine çevirir
export function parseSerbianDate(dateStr?: string | null): Date {
  if (!dateStr) return new Date();
  
  // Örn: "02.10.2026 14:35:10" veya "02.10.2026 14:35"
  const dotPattern = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/;
  const match = dateStr.trim().match(dotPattern);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 0;
    const minute = match[5] ? parseInt(match[5], 10) : 0;
    const second = match[6] ? parseInt(match[6], 10) : 0;
    return new Date(year, month, day, hour, minute, second);
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Fiyat metninden float RSD çıkartır (Örn: "1.870,00 RSD" -> 1870)
export function parseRsdPrice(priceStr?: string | null): number {
  if (!priceStr) return 1870;
  // "1.870,00 RSD" -> "1870.00"
  const clean = priceStr
    .replace(/[^\d,\.]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) || num <= 0 ? 1870 : num;
}

/**
 * Belgrad Parking Servis (https://www.parking-servis.co.rs/eng/edpk) üzerinden
 * belirtilen plakanın aktif günlük park cezası (eDPK) olup olmadığını sorgular.
 */
export async function queryParkingServis(plate: string): Promise<ParkingServisResponse> {
  const cleanPlate = cleanPlateForParkingServis(plate);
  if (!cleanPlate) {
    return { fines: [], error: 'Geçersiz plaka' };
  }

  // Sırbistan belediye SSL sertifika zincirini atlamak için geçici izin:
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    const getUrl = 'https://www.parking-servis.co.rs/eng/edpk';
    const getRes = await fetch(getUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!getRes.ok) {
      console.warn('Parking Servis GET başarısız:', getRes.status, getRes.statusText);
      return { fines: [], error: `Parking Servis yanıt vermedi (HTTP ${getRes.status})` };
    }

    // Cookie'leri topla
    const rawCookies =
      typeof (getRes.headers as any).getSetCookie === 'function'
        ? (getRes.headers as any).getSetCookie()
        : [getRes.headers.get('set-cookie')];

    const cookieMap: Record<string, string> = {};
    (rawCookies || []).forEach((c: any) => {
      if (!c) return;
      c.split(',').forEach((part: string) => {
        const trimmed = part.trim();
        const firstPair = trimmed.split(';')[0];
        const eqIdx = firstPair.indexOf('=');
        if (eqIdx !== -1) {
          const k = firstPair.substring(0, eqIdx).trim();
          const v = firstPair.substring(eqIdx + 1).trim();
          if (k && v) cookieMap[k] = v;
        }
      });
    });

    const cookieHeader = Object.entries(cookieMap)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

    const html = await getRes.text();

    // Honeypot field extraction
    const honeyMatch = html.match(/window\.honey\s*=\s*(\{[\s\S]*?\});/);
    let honey: any = null;
    if (honeyMatch) {
      try {
        honey = eval('(' + honeyMatch[1] + ')');
      } catch (e) {
        console.error('Honey eval error:', e);
      }
    }

    // CSRF Token extraction
    const tokenMatch = html.match(/name="_token"\s+value="([^"]+)"/);
    const token = tokenMatch ? tokenMatch[1] : null;

    const xsrfCookie = cookieMap['XSRF-TOKEN'];
    const xsrfToken = xsrfCookie ? decodeURIComponent(xsrfCookie) : token;

    const payload: Record<string, any> = {
      fine: cleanPlate,
      plate: cleanPlate,
      _token: token,
      'cf-turnstile-response': '',
    };
    if (honey && honey.nameFieldName) {
      payload[honey.nameFieldName] = '';
      payload[honey.validFromFieldName] = honey.encryptedValidFrom;
    }

    const postRes = await fetch('https://www.parking-servis.co.rs/edpk', {
      method: 'POST',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': xsrfToken || '',
        Origin: 'https://www.parking-servis.co.rs',
        Referer: 'https://www.parking-servis.co.rs/eng/edpk',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      console.warn('Parking Servis POST başarısız:', postRes.status, errText);
      return { fines: [], error: `Sorgulama hatası: ${postRes.status}` };
    }

    const data = await postRes.json();
    return {
      paymentAccountNumber: data.paymentAccountNumber || '205-251954-50',
      fines: Array.isArray(data.fines) ? data.fines : [],
    };
  } catch (error: any) {
    console.error('queryParkingServis error:', error);
    return { fines: [], error: error.message || 'Sorgulama sırasında bağlantı hatası oluştu' };
  }
}

/**
 * Tek bir aracı sorgular, bulunan cezaları veritabanına kaydeder
 * ve cezanın kesildiği tarihte aracı kiralayan müşteriyi tespit eder.
 */
export async function checkAndSaveVehicleTickets(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      rentals: {
        include: { customer: true },
        orderBy: { startDate: 'desc' },
      },
    },
  });

  if (!vehicle) return { error: 'Araç bulunamadı', newTickets: [], totalTickets: 0 };

  const res = await queryParkingServis(vehicle.plate);
  if (res.error) {
    return { error: res.error, newTickets: [], totalTickets: 0 };
  }

  const fines = res.fines || [];
  const newTickets: any[] = [];

  for (const fine of fines) {
    const ticketNo = String(fine.id);
    const existing = await prisma.parkingTicket.findUnique({
      where: {
        ticketNumber_plate: {
          ticketNumber: ticketNo,
          plate: vehicle.plate,
        },
      },
    });

    if (!existing) {
      const issueDate = parseSerbianDate(fine.issuedAt);
      const deadlineDate = fine.paymentDeadline ? parseSerbianDate(fine.paymentDeadline) : null;
      const amountRsd = parseRsdPrice(fine.price);
      const amountEur = Math.round((amountRsd / 117) * 100) / 100;
      const fullStreet = [fine.street, fine.streetNumber].filter(Boolean).join(' ').trim();

      // Cezanın kesildiği saatte aracı kiralayan müşteriyi bul
      const matchingRental = vehicle.rentals.find((r) => {
        const start = new Date(r.startDate);
        const end = r.returnDate ? new Date(r.returnDate) : new Date(r.endDate);
        return issueDate >= start && issueDate <= end;
      });

      // Eğer tarih tam eşleşmezse aktif kiradaki müşteriyi veya son kiralayanı ata
      const assignedRental = matchingRental || vehicle.rentals.find((r) => r.status === 'ACTIVE') || vehicle.rentals[0] || null;

      const createdTicket = await prisma.parkingTicket.create({
        data: {
          ticketNumber: ticketNo,
          vehicleId: vehicle.id,
          plate: vehicle.plate,
          cleanPlate: cleanPlateForParkingServis(vehicle.plate),
          zone: fine.zone || null,
          street: fullStreet || 'Belgrad',
          violation: fine.violation || 'Park Cezası (eDPK)',
          amountRsd,
          amountEur,
          discountDescription: fine.discountDescription || '20 gün içinde ödenirse %50 indirim',
          paymentDeadline: deadlineDate,
          referenceNumber: fine.paymentReferenceNumber || null,
          ipsUrl: fine.paymentIpsUrl || null,
          paymentUrl: fine.paymentCcUrl || null,
          status: 'UNPAID',
          issueDate,
          customerId: assignedRental ? assignedRental.customerId : null,
          rentalId: assignedRental ? assignedRental.id : null,
          fleetId: vehicle.fleetId,
          rawData: JSON.stringify(fine),
        },
        include: {
          customer: true,
          vehicle: true,
        },
      });

      newTickets.push(createdTicket);

      // Sistem bildirimi oluştur:
      const custInfo = assignedRental?.customer ? ` (Müşteri: ${assignedRental.customer.name})` : '';
      await prisma.notification.create({
        data: {
          title: `🚨 Park Cezası: ${vehicle.plate}`,
          message: `${vehicle.plate} plakalı araca ${fullStreet || 'Belgrad'} konumunda ${amountRsd} RSD (${amountEur} €) tutarında park cezası kesildi (eDPK #${ticketNo})${custInfo}.`,
          type: 'WARNING',
          targetPlate: vehicle.plate,
          link: '/parking-tickets',
        },
      });
    }
  }

  const allVehicleTickets = await prisma.parkingTicket.findMany({
    where: { vehicleId: vehicle.id },
    orderBy: { issueDate: 'desc' },
  });

  return {
    success: true,
    plate: vehicle.plate,
    totalFinesOnSite: fines.length,
    newTicketsCount: newTickets.length,
    newTickets,
    totalTickets: allVehicleTickets.length,
  };
}

/**
 * Belirtilen filoya ait (veya sistemdeki tüm) aktif araçları sırayla tarar
 */
export async function scanAllFleetTickets(fleetId?: string | null) {
  const where: any = { isDeleted: false };
  if (fleetId) {
    where.fleetId = fleetId;
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    select: { id: true, plate: true, brand: true, model: true },
    orderBy: { plate: 'asc' },
  });

  const results: any[] = [];
  let totalNew = 0;

  for (const v of vehicles) {
    try {
      const res = await checkAndSaveVehicleTickets(v.id);
      results.push({
        vehicleId: v.id,
        plate: v.plate,
        ...res,
      });
      if (res.newTicketsCount) {
        totalNew += res.newTicketsCount;
      }
      // Parking Servis sunucusunu yormamak için araçlar arası 800ms bekle:
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (err: any) {
      console.error(`Hata (${v.plate}):`, err);
      results.push({ vehicleId: v.id, plate: v.plate, error: err.message });
    }
  }

  return {
    scannedCount: vehicles.length,
    newTicketsTotal: totalNew,
    results,
  };
}
