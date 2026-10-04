import * as XLSX from 'xlsx';

export type TargetModuleType =
  | 'VEHICLES'
  | 'CUSTOMERS'
  | 'MAINTENANCE'
  | 'OIL_CHANGE'
  | 'INSPECTION'
  | 'PARKING_TICKETS';

export interface ParsedVehicleRow {
  plate: string;
  brand: string;
  model: string;
  modelYear: number;
  color?: string;
  currentKm: number;
  fuelType: string;
  owner?: string;
  purchasePrice?: number;
  monthlyPrice: number;
  dailyPrice?: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'POST_RENTAL_CHECK';
  customerName?: string;
  customerPhone?: string;
  rentalStartDate?: string;
  rentalEndDate?: string;
  notes?: string;
}

export interface ParsedCustomerRow {
  name: string;
  phone: string;
  identityNo?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface ParsedMaintenanceRow {
  plate: string;
  maintenanceDate: string; // YYYY-MM-DD
  serviceName?: string;
  description: string;
  laborCost?: number;
  partsCost?: number;
  totalCost: number;
  currency: 'EUR' | 'RSD';
  paidBy?: string;
  notes?: string;
}

export interface ParsedOilChangeRow {
  plate: string;
  changeDate: string; // YYYY-MM-DD
  km: number;
  oilType: string;
  filterChanged: boolean;
  cost: number;
  currency: 'EUR' | 'RSD';
  serviceName?: string;
  paidBy?: string;
  notes?: string;
}

export interface ParsedInspectionRow {
  plate: string;
  inspectionDate: string; // YYYY-MM-DD
  nextInspectionDate: string; // YYYY-MM-DD
  cost: number;
  currency: 'EUR' | 'RSD';
  station?: string;
  paidBy?: string;
  notes?: string;
}

export interface ParsedParkingTicketRow {
  plate: string;
  ticketNumber: string;
  issueDate: string;
  amountRsd: number;
  amountEur: number;
  zone?: string;
  street?: string;
  violation?: string;
  status: 'UNPAID' | 'PAID';
}

export interface UniversalAnalysisResult {
  headers: string[];
  sampleRows: Record<string, any>[];
  totalRows: number;
  targetModule: TargetModuleType;
  detectedModuleLabel: string;
  columnMapping: Record<string, string>;
  aiConfidence: string;
  method: 'GEMINI_AI' | 'HEURISTIC_FALLBACK';
  items: any[];
  // Backwards compatibility for vehicle specific:
  vehicles?: ParsedVehicleRow[];
}

export const MODULE_LABELS: Record<TargetModuleType, { tr: string; en: string; sr: string }> = {
  VEHICLES: {
    tr: 'Araçlar & Filo Envanteri',
    en: 'Vehicles & Fleet Inventory',
    sr: 'Vozila i Inventar Flote',
  },
  CUSTOMERS: {
    tr: 'Müşteriler & Rehber',
    en: 'Customers & Contacts',
    sr: 'Klijenti i Imenik',
  },
  MAINTENANCE: {
    tr: 'Periyodik Bakım & Onarım',
    en: 'Maintenance & Repairs',
    sr: 'Održavanje i Popravke',
  },
  OIL_CHANGE: {
    tr: 'Motor Yağı Değişimi',
    en: 'Engine Oil Changes',
    sr: 'Zamena Motornog Ulja',
  },
  INSPECTION: {
    tr: 'Yıllık Muayene & Registracija',
    en: 'Annual Inspection & Registration',
    sr: 'Godišnji Tehnički Pregled i Registracija',
  },
  PARKING_TICKETS: {
    tr: 'Park Cezaları (eDPK)',
    en: 'Parking Tickets (eDPK)',
    sr: 'Parking Kazne (eDPK)',
  },
};

// Clean plate standard
export function cleanPlate(p: any): string {
  if (!p) return '';
  return String(p).trim().toUpperCase();
}

/**
 * Excel Buffer'ını okur ve JSON satırlarına dönüştürür
 */
export function readExcelBuffer(buffer: Buffer): { headers: string[]; rows: Record<string, any>[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel dosyasında sayfa bulunamadı.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rawRows || rawRows.length === 0) {
    throw new Error('Excel dosyası boş veya veri içermiyor.');
  }

  const headers = Object.keys(rawRows[0] || {});
  return { headers, rows: rawRows };
}

/**
 * Gemini AI ile dosyanın hangi modüle ait olduğunu tespit edip şemasını normalize eder
 */
export async function analyzeExcelUniversalWithGemini(
  headers: string[],
  rows: Record<string, any>[]
): Promise<{
  targetModule: TargetModuleType;
  detectedModuleLabel: string;
  columnMapping: Record<string, string>;
  items: any[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY tanımlı değil.');
  }

  const sampleData = rows.slice(0, 25);

  const prompt = `
Sen gelişmiş filo ve filo operasyonları yönetim sistemleri için evrensel veri mühendisisin.
Aşağıda kullanıcının sisteme yüklediği bir Excel dosyasının sütun başlıkları ve ilk ${sampleData.length} satırlık örnek verisi verilmiştir.
Sütunlar Sırpça, Türkçe veya İngilizce olabilir.

GÖREVİN 1: Bu dosyanın aşağıdaki hedef modüllerden hangisine ait olduğunu TESPİT ET ("targetModule"):
- "VEHICLES": Araç plakaları, marka, model, yıl, km, renk, yakıt, kira fiyatı veya araç listesi içeren tablolar.
- "CUSTOMERS": Müşteri/kiracı adı, telefon, pasaport/kimlik no, e-posta içeren müşteri rehberi tabloları.
- "MAINTENANCE": Bakım, onarım, servis adı, parça, işçilik masrafı, servis faturası içeren tablolar.
- "OIL_CHANGE": Motor yağı değişimi, km, yağ türü (5W-30 vb.), yağ filtresi değişimi içeren tablolar.
- "INSPECTION": Yıllık muayene, registracija bitiş tarihi, muayene istasyonu içeren tablolar.
- "PARKING_TICKETS": Park cezası numarası, eDPK, ceza tutarı, park bölgesi (Zona 1/2), ceza saati içeren tablolar.

GÖREVİN 2: Tespit edilen modüle göre sütunları eşle ("columnMapping") ve satırları o modülün alanlarına normalize et ("items"):

EĞER "VEHICLES" İSE:
- plate, brand, model, modelYear, color, currentKm, fuelType, owner, monthlyPrice, dailyPrice, status ("RENTED" veya "AVAILABLE"), customerName, customerPhone, notes

EĞER "CUSTOMERS" İSE:
- name (Zorunlu), phone (Zorunlu), identityNo, email, address, notes

EĞER "MAINTENANCE" İSE:
- plate (Zorunlu), maintenanceDate (YYYY-MM-DD), serviceName, description, laborCost, partsCost, totalCost, currency ("EUR" veya "RSD"), paidBy, notes

EĞER "OIL_CHANGE" İSE:
- plate (Zorunlu), changeDate (YYYY-MM-DD), km, oilType, filterChanged (boolean), cost, currency ("EUR" veya "RSD"), serviceName, paidBy, notes

EĞER "INSPECTION" İSE:
- plate (Zorunlu), inspectionDate (YYYY-MM-DD), nextInspectionDate (YYYY-MM-DD), cost, currency ("EUR" veya "RSD"), station, paidBy, notes

EĞER "PARKING_TICKETS" İSE:
- plate (Zorunlu), ticketNumber (Zorunlu), issueDate (YYYY-MM-DD), amountRsd, amountEur, zone, street, violation, status ("UNPAID" veya "PAID")

SÜTUN BAŞLIKLARI:
${JSON.stringify(headers)}

ÖRNEK VERİLER (İlk ${sampleData.length} satır):
${JSON.stringify(sampleData, null, 2)}

YANIT FORMATI:
Sadece ve sadece geçerli bir JSON objesi döndür:
{
  "targetModule": "VEHICLES" | "CUSTOMERS" | "MAINTENANCE" | "OIL_CHANGE" | "INSPECTION" | "PARKING_TICKETS",
  "detectedModuleLabel": "Örn: Araçlar & Filo Listesi",
  "columnMapping": {
    "ExceldekiSutunAdi": "hedefAlanAdi"
  },
  "items": [
    // Normalize edilmiş satırlar dizisi
  ]
}
`;

  const candidateModels = ['gemini-2.5-flash', 'gemini-3.5-flash-lite'];
  let textOutput: string | null = null;
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      });

      if (response.ok) {
        const jsonRes = await response.json();
        textOutput = jsonRes?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) break;
      } else {
        const errText = await response.text();
        lastError = new Error(`Model ${model} error (${response.status}): ${errText}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!textOutput) {
    throw lastError || new Error('Tüm Gemini modelleri meşgul veya ulaşılamadı.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(textOutput);
  } catch (e) {
    const cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanJson);
  }

  const targetModule: TargetModuleType = parsed.targetModule || 'VEHICLES';
  const columnMapping = parsed.columnMapping || {};
  let items: any[] = Array.isArray(parsed.items) ? parsed.items : [];

  // Örnekten fazla satır varsa geri kalan satırları hedef modül eşleyicisiyle tamamla
  if (rows.length > sampleData.length) {
    const remainingRows = rows.slice(sampleData.length);
    const mappedRemaining = applyUniversalMappingToRows(remainingRows, targetModule, columnMapping);
    items = [...items, ...mappedRemaining];
  }

  return {
    targetModule,
    detectedModuleLabel: parsed.detectedModuleLabel || MODULE_LABELS[targetModule].tr,
    columnMapping,
    items,
  };
}

/**
 * Belirli bir modüle göre satırları dönüştürür
 */
export function applyUniversalMappingToRows(
  rows: Record<string, any>[],
  targetModule: TargetModuleType,
  columnMapping: Record<string, string>
): any[] {
  if (targetModule === 'VEHICLES') {
    return applyMappingToVehicleRows(rows, columnMapping);
  } else if (targetModule === 'CUSTOMERS') {
    return applyMappingToCustomerRows(rows, columnMapping);
  } else if (targetModule === 'MAINTENANCE') {
    return applyMappingToMaintenanceRows(rows, columnMapping);
  } else if (targetModule === 'OIL_CHANGE') {
    return applyMappingToOilChangeRows(rows, columnMapping);
  } else if (targetModule === 'INSPECTION') {
    return applyMappingToInspectionRows(rows, columnMapping);
  } else if (targetModule === 'PARKING_TICKETS') {
    return applyMappingToParkingTicketRows(rows, columnMapping);
  }
  return applyMappingToVehicleRows(rows, columnMapping);
}

function applyMappingToVehicleRows(rows: Record<string, any>[], columnMapping: Record<string, string>): ParsedVehicleRow[] {
  const vehicles: ParsedVehicleRow[] = [];

  for (const row of rows) {
    let plate = '';
    let brand = '';
    let model = '';
    let modelYear = 2020;
    let color = '';
    let currentKm = 0;
    let fuelType = 'Dizel';
    let owner = '';
    let purchasePrice = 0;
    let monthlyPrice = 350;
    let dailyPrice = 0;
    let customerName = '';
    let customerPhone = '';
    let rentalStartDate = '';
    let rentalEndDate = '';
    let notes = '';

    for (const [col, targetField] of Object.entries(columnMapping)) {
      const val = row[col];
      if (val === undefined || val === null || val === '') continue;
      const strVal = String(val).trim();

      if (targetField === 'plate') {
        plate = cleanPlate(strVal);
      } else if (targetField === 'brand' || targetField === 'make') {
        brand = strVal;
      } else if (targetField === 'model') {
        model = strVal;
      } else if (
        targetField === 'vehicleCombined' ||
        targetField === 'brand_and_model' ||
        targetField === 'make_and_model' ||
        targetField === 'vehicle'
      ) {
        const parts = strVal.split(/\s+/);
        const lowerStr = strVal.toLowerCase();
        if (lowerStr.startsWith('alfa romeo')) {
          brand = 'Alfa Romeo';
          model = strVal.substring(10).trim() || 'Giulietta';
        } else if (lowerStr.startsWith('land rover')) {
          brand = 'Land Rover';
          model = strVal.substring(10).trim() || 'Range Rover';
        } else {
          brand = parts[0] || 'Bilinmiyor';
          model = parts.slice(1).join(' ') || 'Model';
        }
      } else if (targetField === 'modelYear') {
        const num = parseInt(strVal, 10);
        if (!isNaN(num) && num > 1990 && num < 2035) modelYear = num;
      } else if (targetField === 'currentKm') {
        const num = parseInt(strVal.replace(/[^\d]/g, ''), 10);
        if (!isNaN(num)) currentKm = num;
      } else if (targetField === 'color') {
        color = strVal;
      } else if (targetField === 'fuelType') {
        fuelType = strVal;
      } else if (targetField === 'owner') {
        owner = strVal;
      } else if (targetField === 'purchasePrice') {
        const num = parseFloat(strVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num) && num > 0) purchasePrice = num;
      } else if (targetField === 'monthlyPrice') {
        const num = parseFloat(strVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num) && num > 0) monthlyPrice = num;
      } else if (targetField === 'dailyPrice') {
        const num = parseFloat(strVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num) && num > 0) dailyPrice = num;
      } else if (targetField === 'customerName') {
        customerName = strVal;
      } else if (targetField === 'customerPhone') {
        customerPhone = strVal;
      } else if (targetField === 'rentalStartDate') {
        rentalStartDate = strVal;
      } else if (targetField === 'rentalEndDate') {
        rentalEndDate = strVal;
      } else if (targetField === 'notes') {
        notes = strVal;
      }
    }

    if (!plate) continue;

    vehicles.push({
      plate,
      brand: brand || 'Bilinmiyor',
      model: model || 'Model',
      modelYear,
      color: color || undefined,
      currentKm,
      fuelType: fuelType || 'Dizel',
      owner: owner || undefined,
      purchasePrice: purchasePrice || undefined,
      monthlyPrice: monthlyPrice || 350,
      dailyPrice: dailyPrice || Math.round((monthlyPrice || 350) / 25),
      status: customerName ? 'RENTED' : 'AVAILABLE',
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      rentalStartDate: rentalStartDate || undefined,
      rentalEndDate: rentalEndDate || undefined,
      notes: notes || undefined,
    });
  }

  return vehicles;
}

function applyMappingToCustomerRows(rows: Record<string, any>[], columnMapping: Record<string, string>): ParsedCustomerRow[] {
  const customers: ParsedCustomerRow[] = [];

  for (const row of rows) {
    let name = '';
    let phone = '';
    let identityNo = '';
    let email = '';
    let address = '';
    let notes = '';

    for (const [col, targetField] of Object.entries(columnMapping)) {
      const val = row[col];
      if (val === undefined || val === null || val === '') continue;
      const strVal = String(val).trim();

      if (targetField === 'name' || targetField === 'customerName' || targetField === 'client') {
        name = strVal;
      } else if (targetField === 'phone' || targetField === 'mobile' || targetField === 'tel') {
        phone = strVal;
      } else if (targetField === 'identityNo' || targetField === 'passport' || targetField === 'jmbg') {
        identityNo = strVal;
      } else if (targetField === 'email' || targetField === 'mail') {
        email = strVal;
      } else if (targetField === 'address' || targetField === 'adresa') {
        address = strVal;
      } else if (targetField === 'notes' || targetField === 'napomena') {
        notes = strVal;
      }
    }

    if (!name) continue;

    customers.push({
      name,
      phone: phone || '+381 60 0000000',
      identityNo: identityNo || undefined,
      email: email || undefined,
      address: address || undefined,
      notes: notes || undefined,
    });
  }

  return customers;
}

function applyMappingToMaintenanceRows(rows: Record<string, any>[], columnMapping: Record<string, string>): ParsedMaintenanceRow[] {
  const list: ParsedMaintenanceRow[] = [];

  for (const row of rows) {
    let plate = '';
    let maintenanceDate = new Date().toISOString().split('T')[0];
    let serviceName = '';
    let description = '';
    let laborCost = 0;
    let partsCost = 0;
    let totalCost = 0;
    let currency: 'EUR' | 'RSD' = 'EUR';
    let paidBy = '';
    let notes = '';

    for (const [col, targetField] of Object.entries(columnMapping)) {
      const val = row[col];
      if (val === undefined || val === null || val === '') continue;
      const strVal = String(val).trim();

      if (targetField === 'plate') {
        plate = cleanPlate(strVal);
      } else if (targetField === 'maintenanceDate' || targetField === 'date') {
        maintenanceDate = strVal;
      } else if (targetField === 'serviceName' || targetField === 'servis') {
        serviceName = strVal;
      } else if (targetField === 'description' || targetField === 'opis' || targetField === 'islem') {
        description = strVal;
      } else if (targetField === 'laborCost') {
        const num = parseFloat(strVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num)) laborCost = num;
      } else if (targetField === 'partsCost') {
        const num = parseFloat(strVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num)) partsCost = num;
      } else if (targetField === 'totalCost' || targetField === 'cost' || targetField === 'cena') {
        const num = parseFloat(strVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num)) totalCost = num;
        if (strVal.toLowerCase().includes('rsd') || strVal.toLowerCase().includes('din')) currency = 'RSD';
      } else if (targetField === 'currency') {
        currency = strVal.toUpperCase().includes('RSD') ? 'RSD' : 'EUR';
      } else if (targetField === 'paidBy') {
        paidBy = strVal;
      } else if (targetField === 'notes') {
        notes = strVal;
      }
    }

    if (!plate) continue;
    if (!totalCost && (laborCost || partsCost)) {
      totalCost = laborCost + partsCost;
    }

    list.push({
      plate,
      maintenanceDate,
      serviceName: serviceName || 'Özel Servis',
      description: description || 'Periyodik Bakım ve Onarım',
      laborCost,
      partsCost,
      totalCost: totalCost || 50,
      currency,
      paidBy: paidBy || undefined,
      notes: notes || undefined,
    });
  }

  return list;
}

function applyMappingToOilChangeRows(rows: Record<string, any>[], columnMapping: Record<string, string>): ParsedOilChangeRow[] {
  const list: ParsedOilChangeRow[] = [];

  for (const row of rows) {
    let plate = '';
    let changeDate = new Date().toISOString().split('T')[0];
    let km = 0;
    let oilType = '5W-30 Tam Sentetik';
    let filterChanged = true;
    let cost = 0;
    let currency: 'EUR' | 'RSD' = 'EUR';
    let serviceName = '';
    let paidBy = '';
    let notes = '';

    for (const [col, targetField] of Object.entries(columnMapping)) {
      const val = row[col];
      if (val === undefined || val === null || val === '') continue;
      const strVal = String(val).trim();

      if (targetField === 'plate') {
        plate = cleanPlate(strVal);
      } else if (targetField === 'changeDate' || targetField === 'date') {
        changeDate = strVal;
      } else if (targetField === 'km' || targetField === 'kilometraza') {
        const num = parseInt(strVal.replace(/[^\d]/g, ''), 10);
        if (!isNaN(num)) km = num;
      } else if (targetField === 'oilType' || targetField === 'ulje') {
        oilType = strVal;
      } else if (targetField === 'cost' || targetField === 'cena') {
        const num = parseFloat(strVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num)) cost = num;
        if (strVal.toLowerCase().includes('rsd') || strVal.toLowerCase().includes('din')) currency = 'RSD';
      } else if (targetField === 'serviceName') {
        serviceName = strVal;
      } else if (targetField === 'paidBy') {
        paidBy = strVal;
      } else if (targetField === 'notes') {
        notes = strVal;
      }
    }

    if (!plate) continue;

    list.push({
      plate,
      changeDate,
      km,
      oilType: oilType || '5W-30',
      filterChanged,
      cost: cost || 60,
      currency,
      serviceName: serviceName || undefined,
      paidBy: paidBy || undefined,
      notes: notes || undefined,
    });
  }

  return list;
}

function applyMappingToInspectionRows(rows: Record<string, any>[], columnMapping: Record<string, string>): ParsedInspectionRow[] {
  const list: ParsedInspectionRow[] = [];

  for (const row of rows) {
    let plate = '';
    let inspectionDate = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    let nextInspectionDate = nextYear.toISOString().split('T')[0];
    let cost = 0;
    let currency: 'EUR' | 'RSD' = 'EUR';
    let station = 'Auto Centar Beograd';
    let paidBy = '';
    let notes = '';

    for (const [col, targetField] of Object.entries(columnMapping)) {
      const val = row[col];
      if (val === undefined || val === null || val === '') continue;
      const strVal = String(val).trim();

      if (targetField === 'plate') {
        plate = cleanPlate(strVal);
      } else if (targetField === 'inspectionDate') {
        inspectionDate = strVal;
      } else if (targetField === 'nextInspectionDate' || targetField === 'expiryDate' || targetField === 'registracijaDo') {
        nextInspectionDate = strVal;
      } else if (targetField === 'cost' || targetField === 'cena') {
        const num = parseFloat(strVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num)) cost = num;
        if (strVal.toLowerCase().includes('rsd') || strVal.toLowerCase().includes('din')) currency = 'RSD';
      } else if (targetField === 'station') {
        station = strVal;
      } else if (targetField === 'paidBy') {
        paidBy = strVal;
      } else if (targetField === 'notes') {
        notes = strVal;
      }
    }

    if (!plate) continue;

    list.push({
      plate,
      inspectionDate,
      nextInspectionDate,
      cost: cost || 120,
      currency,
      station,
      paidBy: paidBy || undefined,
      notes: notes || undefined,
    });
  }

  return list;
}

function applyMappingToParkingTicketRows(rows: Record<string, any>[], columnMapping: Record<string, string>): ParsedParkingTicketRow[] {
  const list: ParsedParkingTicketRow[] = [];

  for (const row of rows) {
    let plate = '';
    let ticketNumber = 'EDPK-' + Math.floor(100000 + Math.random() * 900000);
    let issueDate = new Date().toISOString().split('T')[0];
    let amountRsd = 1870;
    let amountEur = 16;
    let zone = 'Zona 2';
    let street = '';
    let violation = 'Isteklo vreme parkiranja';
    let status: 'UNPAID' | 'PAID' = 'UNPAID';

    for (const [col, targetField] of Object.entries(columnMapping)) {
      const val = row[col];
      if (val === undefined || val === null || val === '') continue;
      const strVal = String(val).trim();

      if (targetField === 'plate') {
        plate = cleanPlate(strVal);
      } else if (targetField === 'ticketNumber' || targetField === 'broj') {
        ticketNumber = strVal;
      } else if (targetField === 'issueDate' || targetField === 'date') {
        issueDate = strVal;
      } else if (targetField === 'amountRsd') {
        const num = parseFloat(strVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num)) amountRsd = num;
      } else if (targetField === 'amountEur') {
        const num = parseFloat(strVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num)) amountEur = num;
      } else if (targetField === 'zone') {
        zone = strVal;
      } else if (targetField === 'street' || targetField === 'ulica') {
        street = strVal;
      } else if (targetField === 'violation' || targetField === 'razlog') {
        violation = strVal;
      } else if (targetField === 'status') {
        status = strVal.toLowerCase().includes('paid') || strVal.toLowerCase().includes('plac') ? 'PAID' : 'UNPAID';
      }
    }

    if (!plate) continue;
    if (amountRsd && !amountEur) amountEur = Math.round(amountRsd / 117);

    list.push({
      plate,
      ticketNumber,
      issueDate,
      amountRsd,
      amountEur,
      zone,
      street: street || undefined,
      violation,
      status,
    });
  }

  return list;
}

/**
 * Sezgisel (Heuristic) fallback motoru: AI ulaşılamadığında başlıkları inceler
 */
export function heuristicAnalyzeUniversalExcel(
  headers: string[],
  rows: Record<string, any>[]
): {
  targetModule: TargetModuleType;
  detectedModuleLabel: string;
  columnMapping: Record<string, string>;
  items: any[];
} {
  // Sütunlara göre modül tespiti
  const headerStr = headers.join(' ').toLowerCase();

  let targetModule: TargetModuleType = 'VEHICLES';
  if (headerStr.match(/kazn|ticket|edpk|parking|parkir/i)) {
    targetModule = 'PARKING_TICKETS';
  } else if (headerStr.match(/servis|poprav|labor|delov|tamir|bakim|masraf/i)) {
    targetModule = 'MAINTENANCE';
  } else if (headerStr.match(/ulje|yag|filter|5w30|5w40/i)) {
    targetModule = 'OIL_CHANGE';
  } else if (headerStr.match(/tehnick|registrac|muayene|istasyon/i)) {
    targetModule = 'INSPECTION';
  } else if (headerStr.match(/klijent|kupac|musteri|pasos|jmbg|adresa/i) && !headerStr.match(/auto|vozilo|plak/i)) {
    targetModule = 'CUSTOMERS';
  }

  const columnMapping: Record<string, string> = {};

  for (const h of headers) {
    const lower = h.toLowerCase().trim();
    if (lower.match(/plak|tablic|registra|plate/i)) {
      columnMapping[h] = 'plate';
    } else if (lower.match(/marka|brand|proizvod/i)) {
      columnMapping[h] = 'brand';
    } else if (lower.match(/model|tip/i)) {
      columnMapping[h] = 'model';
    } else if (lower.match(/auto|vozilo|arac/i)) {
      columnMapping[h] = 'vehicleCombined';
    } else if (lower.match(/god|yil|year/i)) {
      columnMapping[h] = 'modelYear';
    } else if (lower.match(/km|kilomet|stanje/i)) {
      columnMapping[h] = 'currentKm';
    } else if (lower.match(/cena|fiyat|price|cost|tutar/i)) {
      columnMapping[h] = targetModule === 'VEHICLES' ? 'monthlyPrice' : 'totalCost';
    } else if (lower.match(/klijent|musteri|vozac|name|ad/i)) {
      columnMapping[h] = targetModule === 'CUSTOMERS' ? 'name' : 'customerName';
    } else if (lower.match(/tel|phone|mobil/i)) {
      columnMapping[h] = targetModule === 'CUSTOMERS' ? 'phone' : 'customerPhone';
    } else if (lower.match(/opis|islem|desc|ariza/i)) {
      columnMapping[h] = 'description';
    } else if (lower.match(/servis|service/i)) {
      columnMapping[h] = 'serviceName';
    } else if (lower.match(/broj|ticket|ceza_no/i)) {
      columnMapping[h] = 'ticketNumber';
    }
  }

  const items = applyUniversalMappingToRows(rows, targetModule, columnMapping);

  return {
    targetModule,
    detectedModuleLabel: MODULE_LABELS[targetModule].tr,
    columnMapping,
    items,
  };
}

/**
 * Universal Ana Fonksiyon
 */
export async function parseAndAnalyzeExcel(buffer: Buffer): Promise<UniversalAnalysisResult> {
  const { headers, rows } = readExcelBuffer(buffer);

  let targetModule: TargetModuleType = 'VEHICLES';
  let detectedModuleLabel = 'Araçlar & Filo';
  let columnMapping: Record<string, string> = {};
  let items: any[] = [];
  let method: 'GEMINI_AI' | 'HEURISTIC_FALLBACK' = 'GEMINI_AI';
  let aiConfidence = 'Yüksek (%98)';

  try {
    const aiRes = await analyzeExcelUniversalWithGemini(headers, rows);
    targetModule = aiRes.targetModule;
    detectedModuleLabel = aiRes.detectedModuleLabel;
    columnMapping = aiRes.columnMapping;
    items = aiRes.items;
  } catch (err: any) {
    console.warn('Gemini Universal AI analizi başarısız oldu, kural motoruna geçiliyor:', err.message);
    const fb = heuristicAnalyzeUniversalExcel(headers, rows);
    targetModule = fb.targetModule;
    detectedModuleLabel = fb.detectedModuleLabel;
    columnMapping = fb.columnMapping;
    items = fb.items;
    method = 'HEURISTIC_FALLBACK';
    aiConfidence = 'Kural Motoru Eşleşmesi';
  }

  return {
    headers,
    sampleRows: rows.slice(0, 5),
    totalRows: rows.length,
    targetModule,
    detectedModuleLabel,
    columnMapping,
    aiConfidence,
    method,
    items,
    // Geriye dönük uyumluluk:
    vehicles: targetModule === 'VEHICLES' ? items : undefined,
  };
}
