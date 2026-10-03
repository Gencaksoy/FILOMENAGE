export const EUR_TO_RSD_RATE = 117; // 1 EUR = 117 RSD sabit kur
export const SERBIA_TIMEZONE = 'Europe/Belgrade'; // Sırbistan saat dilimi (CET/CEST)

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  try {
    const parts = new Intl.DateTimeFormat('sr-Latn-RS', {
      timeZone: SERBIA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(d);
    const day = parts.find((p) => p.type === 'day')?.value || String(d.getDate()).padStart(2, '0');
    const month = parts.find((p) => p.type === 'month')?.value || String(d.getMonth() + 1).padStart(2, '0');
    const year = parts.find((p) => p.type === 'year')?.value || String(d.getFullYear());
    return `${day}.${month}.${year}`;
  } catch {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  try {
    const parts = new Intl.DateTimeFormat('sr-Latn-RS', {
      timeZone: SERBIA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const day = parts.find((p) => p.type === 'day')?.value || String(d.getDate()).padStart(2, '0');
    const month = parts.find((p) => p.type === 'month')?.value || String(d.getMonth() + 1).padStart(2, '0');
    const year = parts.find((p) => p.type === 'year')?.value || String(d.getFullYear());
    const hour = parts.find((p) => p.type === 'hour')?.value || String(d.getHours()).padStart(2, '0');
    const minute = parts.find((p) => p.type === 'minute')?.value || String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hour}:${minute}`;
  } catch {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }
}

export function formatCurrency(amount: number | null | undefined, currency: string = '€'): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return `0 ${currency}`;
  const num = Number(amount);
  const symbol = currency === 'EUR' ? '€' : currency === 'RSD' ? 'RSD' : currency;
  return `${new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)} ${symbol}`;
}

export function formatRsd(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '0 RSD';
  return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(Number(amount))} RSD`;
}

export function formatKm(km: number | null | undefined): string {
  if (km === null || km === undefined || isNaN(Number(km))) return '0 KM';
  return `${new Intl.NumberFormat('de-DE').format(Number(km))} KM`;
}

export function rsdToEur(rsd: number): number {
  if (!rsd || isNaN(rsd)) return 0;
  return Math.round((Number(rsd) / EUR_TO_RSD_RATE) * 100) / 100;
}

export function eurToRsd(eur: number): number {
  if (!eur || isNaN(eur)) return 0;
  return Math.round(Number(eur) * EUR_TO_RSD_RATE);
}

export function getCompanyNameForOwner(owner?: string | null, fallback: string = 'Filo Yönetim'): string {
  if (fallback && fallback !== 'Filo Yönetim') return fallback;
  if (!owner) return fallback;
  return owner;
}

export function generateWhatsAppReminderUrl(
  phone: string,
  customerName: string,
  plate: string,
  startDate?: string | Date,
  endDate?: string | Date,
  daysLeft: number = 3,
  companyName: string = 'Filo Yönetim',
  owner?: string | null
): string {
  // Clean phone number: remove spaces, +, -, parentheses
  let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone) return '#';

  const effectiveCompany = owner ? getCompanyNameForOwner(owner, companyName) : companyName;
  const startStr = startDate ? formatDate(startDate) : '';
  const endStr = endDate ? formatDate(endDate) : '';

  let message = '';
  if (daysLeft < 0) {
    message = `Sayın ${customerName}, ${plate} plakalı kiralık aracınızın teslim süresi ${Math.abs(daysLeft)} gün önce (${endStr}) dolmuştur. Lütfen aracı teslim etmek veya sözleşmeyi uzatmak için ivedilikle bizimle iletişime geçiniz. - ${effectiveCompany}`;
  } else if (diffDaysMessage(daysLeft)) {
    message = `Sayın ${customerName}, ${plate} plakalı kiralık aracımızın kira süresi BUGÜN (${endStr}) dolmaktadır. Teslimat için gün içerisinde ofisimize bekleriz. - ${effectiveCompany}`;
  } else {
    message = `Sayın ${customerName}, ${startStr ? startStr + ' tarihinde teslim aldığınız ' : ''}${plate} plakalı aracımızın kira süresi ${daysLeft} gün sonra (${endStr}) dolacaktır. Hatırlatmak ister, iyi günler dileriz. - ${effectiveCompany}`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function diffDaysMessage(daysLeft: number) {
  return daysLeft === 0;
}

export const VEHICLE_STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  AVAILABLE: {
    label: 'Boşta (Hazır)',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'text-emerald-700',
  },
  RENTED: {
    label: 'Müşteride (Kirada)',
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    text: 'text-amber-800',
  },
  MAINTENANCE: {
    label: 'Serviste (Bakım/Onarım)',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    text: 'text-rose-700',
  },
  POST_RENTAL_CHECK: {
    label: 'Kiradan Sonra Bakım / Kontrol',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    text: 'text-purple-700',
  },
};

export function getVehicleStatusLabel(status: string, lang: 'tr' | 'en' | 'sr' = 'tr'): string {
  switch (status) {
    case 'AVAILABLE':
      return lang === 'sr' ? 'Slobodno (Spremno)' : lang === 'en' ? 'Available' : 'Boşta (Hazır)';
    case 'RENTED':
      return lang === 'sr' ? 'U Najmu (Kirada)' : lang === 'en' ? 'Rented' : 'Kirada';
    case 'MAINTENANCE':
    case 'IN_SERVICE':
      return lang === 'sr' ? 'U Servisu' : lang === 'en' ? 'In Maintenance' : 'Serviste';
    case 'FAULT':
    case 'DAMAGED':
      return lang === 'sr' ? 'Sa Kvarom' : lang === 'en' ? 'Defective' : 'Arızalı';
    case 'INSPECTION':
      return lang === 'sr' ? 'Na Tehničkom' : lang === 'en' ? 'In Inspection' : 'Muayenede';
    case 'POST_RENTAL_CHECK':
      return lang === 'sr' ? 'Kontrola nakon Zakupa' : lang === 'en' ? 'Post-Rental Check' : 'Kira Sonu Kontrolü';
    default:
      return status;
  }
}


export function generateParkingFineWhatsAppUrl(
  customerPhone?: string | null,
  customerName?: string | null,
  ticket?: {
    plate: string;
    ticketNumber: string;
    street?: string | null;
    zone?: string | null;
    amountRsd: number;
    amountEur?: number | null;
    issueDate: string | Date;
    referenceNumber?: string | null;
    vehicle?: { owner?: string | null } | null;
  } | null,
  companyName: string = 'Filo Yönetim',
  owner?: string | null
): string {
  if (!customerPhone || !ticket) return '#';

  const vehicleOwner = owner || ticket.vehicle?.owner;
  const effectiveCompany = vehicleOwner ? getCompanyNameForOwner(vehicleOwner, companyName) : companyName;
  const cleanPhone = customerPhone.replace(/[^\d+]/g, '');
  const formattedDate = formatDate(ticket.issueDate);
  const location = [ticket.street, ticket.zone].filter(Boolean).join(' - ') || 'Belgrad';
  const name = customerName || 'Değerli Müşterimiz';
  const eurText = ticket.amountEur ? ` (~${ticket.amountEur} €)` : '';

  const message = `Merhaba Sayın ${name},

${effectiveCompany} firmasından ulaşıyoruz.

Kullanımınızda bulunan ${ticket.plate} plakalı aracımız için aşağıdaki park cezası tespit edilmiştir:

📍 Konum: ${location}
📅 Tarih: ${formattedDate}
💰 Ceza Tutarı: ${ticket.amountRsd} RSD${eurText}
📋 eDPK No: ${ticket.ticketNumber}
🔢 Referans No: ${ticket.referenceNumber || ticket.ticketNumber}

⚠️ Önemli Not: Belgrad Parking Servis kuralları uyarınca, cezanın 20 gün içinde ödenmesi durumunda %50 indirim uygulanmaktadır.

Cezanın ödenmesi veya detayları için lütfen tarafımızla en kısa sürede iletişime geçiniz.`;

  return `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
}

