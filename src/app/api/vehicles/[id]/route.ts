import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const isSuper =
      currentUser.role === 'SUPER_ADMIN';

    if (!isSuper && currentUser.features?.vehicles === false) {
      return NextResponse.json({ error: 'Araç yönetimi özelliği filonuz için devre dışıdır.' }, { status: 403 });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      include: {
        rentals: {
          include: { customer: true },
          orderBy: { startDate: 'desc' },
        },
        maintenances: {
          orderBy: { maintenanceDate: 'desc' },
          include: {
            parts: {
              orderBy: { changeDate: 'desc' },
            },
          },
        },
        oilChanges: {
          orderBy: { changeDate: 'desc' },
        },
        inspections: {
          orderBy: { inspectionDate: 'desc' },
        },
        faults: {
          orderBy: [
            { status: 'asc' },
            { createdAt: 'desc' },
          ],
        },
        parkingTickets: {
          orderBy: { issueDate: 'desc' },
          include: {
            customer: {
              select: { id: true, name: true, phone: true },
            },
            rental: {
              select: { id: true, startDate: true, endDate: true },
            },
          },
        },
      },
    });

    if (!vehicle || vehicle.isDeleted) {
      return NextResponse.json({ error: 'Araç bulunamadı.' }, { status: 404 });
    }

    if (!isSuper && vehicle.fleetId && currentUser.fleetId && vehicle.fleetId !== currentUser.fleetId) {
      return NextResponse.json({ error: 'Bu araca erişim yetkiniz bulunmamaktadır.' }, { status: 403 });
    }

    const now = new Date();
    const activeRental = vehicle.status === 'RENTED'
      ? vehicle.rentals.find((r) => r.status === 'ACTIVE') || null
      : null;
    let remainingDays: number | null = null;
    let remainingText = 'Boşta (Kiralanabilir)';

    if (activeRental) {
      const endDate = new Date(activeRental.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (remainingDays < 0) {
        remainingText = `${Math.abs(remainingDays)} gün gecikti (Süresi doldu!)`;
      } else if (remainingDays === 0) {
        remainingText = 'BUGÜN teslim alınacak';
      } else if (remainingDays === 1) {
        remainingText = 'Yarın teslim alınacak';
      } else {
        remainingText = `${remainingDays} gün kaldı`;
      }
    } else if (vehicle.status === 'RENTED') {
      remainingText = 'Müşteride Kirada';
    } else if (vehicle.status === 'POST_RENTAL_CHECK') {
      remainingText = 'Kiradan Sonra Bakım / Temizlikte';
    } else if (vehicle.status === 'MAINTENANCE') {
      remainingText = 'Serviste';
    }

    // Registracija (Register) kalan gün
    let regDaysLeft: number | null = null;
    if (vehicle.registrationExpiry) {
      const regDiff = new Date(vehicle.registrationExpiry).getTime() - now.getTime();
      regDaysLeft = Math.ceil(regDiff / (1000 * 60 * 60 * 24));
    }

    const latestMaintenance = vehicle.maintenances[0] || null;
    const latestOilChange = vehicle.oilChanges[0] || null;
    const latestInspection = vehicle.inspections[0] || null;

    // Financials & Amortization (Tüm Maliyetler: Alış + İlk Tescil + Bakım + Yağ + Muayene + Arıza)
    const purchasePrice = vehicle.purchasePrice || 0;
    const initialExpenses = vehicle.initialExpenses || 0;
    const totalInvestment = purchasePrice + initialExpenses;

    const totalRentalRevenue = vehicle.rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const totalMaintenanceCost = vehicle.maintenances.reduce((acc, m) => acc + (m.totalCost || 0), 0);
    const totalOilCost = vehicle.oilChanges.reduce((acc, o) => acc + (o.cost || 0), 0);
    const totalInspectionCost = vehicle.inspections.reduce((acc, i) => acc + (i.cost || 0), 0);
    const totalFaultCost = vehicle.faults.reduce((acc, f) => acc + (f.cost || 0), 0);
    const totalOperatingCost = totalMaintenanceCost + totalOilCost + totalInspectionCost + totalFaultCost;

    // Toplam Araç Maliyeti / Gideri = Yatırım + İşletme Masrafları
    const totalCost = totalInvestment + totalOperatingCost;
    const totalExpenses = totalCost;
    const netProfit = totalRentalRevenue - totalCost;
    const remainingAmortization = Math.max(0, totalCost - totalRentalRevenue);
    const isAmortized = totalCost > 0 && totalRentalRevenue >= totalCost;
    const amortizationPercent = totalCost > 0
      ? Math.min(100, Math.round((totalRentalRevenue / totalCost) * 100))
      : 100;

    return NextResponse.json({
      vehicle: {
        ...vehicle,
        regDaysLeft,
      },
      activeRental: activeRental
        ? {
            ...activeRental,
            customerName: activeRental.customer?.name || '',
            customerPhone: activeRental.customer?.phone || '',
            contractUrl: activeRental.contractUrl || null,
            contractTitle: activeRental.contractTitle || null,
            remainingDays,
            remainingText,
            photos: {
              front: activeRental.photoFront,
              back: activeRental.photoBack,
              right: activeRental.photoRight,
              left: activeRental.photoLeft,
            },
          }
        : null,
      financials: {
        purchasePrice,
        initialExpenses,
        totalInvestment,
        totalMaintenanceCost,
        totalOilCost,
        totalInspectionCost,
        totalFaultCost,
        totalOperatingCost,
        totalExpenses: totalCost, // Genel Toplam Araç Gideri
        totalCost,
        totalRentalRevenue,
        netProfit,
        remainingAmortization,
        isAmortized,
        amortizationPercent,
      },
      rentalHistory: vehicle.rentals,
      latestMaintenance,
      latestOilChange,
      latestInspection,
      totalExpenses,
      totalMaintenanceCost,
      totalOilCost,
      totalInspectionCost,
      maintenances: vehicle.maintenances,
      oilChanges: vehicle.oilChanges,
      inspections: vehicle.inspections,
      faults: vehicle.faults,
      activeFaultsCount: vehicle.faults.filter((f) => f.status === 'OPEN' || f.status === 'IN_PROGRESS').length,
    });
  } catch (error) {
    console.error('Vehicle detail error:', error);
    return NextResponse.json({ error: 'Araç detayı alınamadı.' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getSessionUser();
    const currentVehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      include: { fleet: true },
    });

    if (!currentVehicle) {
      return NextResponse.json({ error: 'Araç bulunamadı.' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    // 1. Plaka Değiştirme ve Kontrolleri
    if (body.plate !== undefined) {
      const newPlate = body.plate.trim().toUpperCase();
      if (!newPlate) {
        return NextResponse.json({ error: 'Plaka boş bırakılamaz.' }, { status: 400 });
      }
      const existingWithPlate = await prisma.vehicle.findFirst({
        where: {
          plate: newPlate,
          NOT: { id: params.id },
        },
      });
      if (existingWithPlate) {
        return NextResponse.json(
          { error: `${newPlate} plakası zaten başka bir araca kayıtlıdır.` },
          { status: 400 }
        );
      }
      updateData.plate = newPlate;
    }

    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.modelYear !== undefined) updateData.modelYear = parseInt(body.modelYear, 10);
    if (body.color !== undefined) updateData.color = body.color;
    if (body.currentKm !== undefined) updateData.currentKm = parseInt(body.currentKm, 10);
    if (body.dailyPrice !== undefined) updateData.dailyPrice = parseFloat(body.dailyPrice) || 0;
    if (body.monthlyPrice !== undefined) updateData.monthlyPrice = parseFloat(body.monthlyPrice) || 350;
    if (body.owner !== undefined) updateData.owner = body.owner;
    if (body.fuelType !== undefined) updateData.fuelType = body.fuelType;
    if (body.fuelConsumptionRsd !== undefined) updateData.fuelConsumptionRsd = parseFloat(body.fuelConsumptionRsd) || 0;
    if (body.registrationExpiry !== undefined) {
      updateData.registrationExpiry = body.registrationExpiry ? new Date(body.registrationExpiry) : null;
    }
    if (body.purchasePrice !== undefined) updateData.purchasePrice = parseFloat(body.purchasePrice) || 0;
    if (body.initialExpenses !== undefined) updateData.initialExpenses = parseFloat(body.initialExpenses) || 0;
    if (body.accessories !== undefined) {
      updateData.accessories = typeof body.accessories === 'string' ? body.accessories : JSON.stringify(body.accessories);
    }
    if (body.vin !== undefined) updateData.vin = body.vin ? body.vin.trim() : null;
    if (body.engineNo !== undefined) updateData.engineNo = body.engineNo ? body.engineNo.trim() : null;
    if (body.chronicIssues !== undefined) updateData.chronicIssues = body.chronicIssues ? body.chronicIssues.trim() : null;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // 2. Durum Değişikliği & Kiralama / Boşta Kolerasyonu
    if (body.status !== undefined) {
      updateData.status = body.status;

      // Araç Boşta, Serviste veya Muayenede yapıldığında devam eden aktif kiralama kaydını kapat
      if (body.status === 'AVAILABLE' || body.status === 'MAINTENANCE' || body.status === 'POST_RENTAL_CHECK') {
        await prisma.rental.updateMany({
          where: { vehicleId: params.id, status: 'ACTIVE' },
          data: {
            status: 'RETURNED',
            returnDate: new Date(),
            notes: `Araç durumu ${body.status === 'AVAILABLE' ? 'Boşta' : body.status} olarak güncellendiğinde kiralama otomatik sonlandırıldı.`,
          },
        });
      }
    }

    // 3. Eğer araç KİRADA (RENTED) yapılıyorsa müşteri bağlantısını ve sözleşmesini kur
    const targetStatus = updateData.status || currentVehicle.status;
    if (targetStatus === 'RENTED') {
      let targetCustomerId = body.customerId || null;
      if (!targetCustomerId && body.customerName && body.customerName.trim()) {
        const cName = body.customerName.trim();
        const cPhone = body.customerPhone?.trim() || '-';
        let cust = await prisma.customer.findFirst({
          where: {
            fleetId: currentVehicle.fleetId,
            name: { equals: cName, mode: 'insensitive' },
            isDeleted: false,
          },
        });
        if (!cust) {
          cust = await prisma.customer.create({
            data: {
              name: cName,
              phone: cPhone,
              fleetId: currentVehicle.fleetId,
            },
          });
        }
        targetCustomerId = cust.id;
      }

      if (targetCustomerId) {
        // Zaten aynı müşteri için aktif bir kiralama yoksa oluştur
        const existingActive = await prisma.rental.findFirst({
          where: { vehicleId: params.id, status: 'ACTIVE' },
        });

        if (!existingActive) {
          const rStart = body.rentalStartDate ? new Date(body.rentalStartDate) : new Date();
          const rEnd = body.rentalEndDate ? new Date(body.rentalEndDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const mRate = parseFloat(body.monthlyPrice) || currentVehicle.monthlyPrice || 350;
          const diffTime = rEnd.getTime() - rStart.getTime();
          const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          const months = Math.max(1, Math.round(diffDays / 30));
          const totalAmount = months * mRate;

          const createdRental = await prisma.rental.create({
            data: {
              vehicleId: params.id,
              customerId: targetCustomerId,
              startDate: rStart,
              endDate: rEnd,
              startKm: updateData.currentKm ?? currentVehicle.currentKm,
              monthlyRate: mRate,
              dailyRate: mRate / 30,
              totalAmount,
              isPaid: body.isPaid !== undefined ? Boolean(body.isPaid) : true,
              status: 'ACTIVE',
              contractUrl: body.contractUrl || null,
              contractTitle: body.contractTitle || null,
              deliveryAccessories: updateData.accessories || currentVehicle.accessories,
              notes: body.rentalNotes?.trim() || 'Araç güncellenirken kiralama kaydı oluşturuldu.',
            },
          });

          // Sözleşme yüklendiyse müşteri evraklarına da ekle
          if (body.contractUrl) {
            const contractDocTitle = body.contractTitle || `${updateData.plate || currentVehicle.plate} Kiralama Sözleşmesi (${rStart.toISOString().slice(0, 10)} - ${rEnd.toISOString().slice(0, 10)})`;
            await prisma.customerDocument.create({
              data: {
                customerId: targetCustomerId,
                rentalId: createdRental.id,
                docType: 'CONTRACT',
                title: contractDocTitle,
                fileUrl: body.contractUrl,
              },
            });
          }
        }
      }
    }

    // 4. Aracı Güncelle
    const updated = await prisma.vehicle.update({
      where: { id: params.id },
      data: updateData,
    });

    // 5. Plaka Değiştiyse İlgili Park Cezası Kayıtlarını da Senkronize Et
    if (updateData.plate && updateData.plate !== currentVehicle.plate) {
      const cleanPlate = updateData.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      await prisma.parkingTicket.updateMany({
        where: { vehicleId: params.id },
        data: {
          plate: updateData.plate,
          cleanPlate,
        },
      });
    }

    const plateChangeNote = updateData.plate && updateData.plate !== currentVehicle.plate
      ? `Plaka değiştirildi: [${currentVehicle.plate} ➔ ${updateData.plate}]. `
      : '';

    await logAudit({
      userName: currentUser?.name || body.userName || 'Yönetici',
      userRole: currentUser?.role || body.userRole || 'ADMIN',
      action: 'UPDATE_VEHICLE',
      target: updated.plate,
      fleetId: updated.fleetId,
      description: `${plateChangeNote}${updated.plate} araç bilgileri güncellendi (Sahip: ${updated.owner}, Durum: ${updated.status}).`,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Vehicle PUT error:', error);
    return NextResponse.json({ error: error.message || 'Araç güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if caller is STAFF
    const currentUser = await getSessionUser();
    if (currentUser && currentUser.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Çalışanların (STAFF) sistemden veri ve araç silme yetkisi yoktur!' },
        { status: 403 }
      );
    }

    const fullVehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      include: {
        rentals: {
          include: { customer: true },
        },
        maintenances: {
          include: { parts: true },
        },
        oilChanges: true,
        inspections: true,
        faults: true,
      },
    });

    if (!fullVehicle) {
      return NextResponse.json({ error: 'Araç bulunamadı.' }, { status: 404 });
    }

    const hasActiveRental = fullVehicle.rentals.some((r) => r.status === 'ACTIVE');
    if (hasActiveRental) {
      return NextResponse.json(
        { error: 'Bu araç şu anda müşteride kiradadır! Önce aracı teslim alınız.' },
        { status: 400 }
      );
    }

    // 1. Veriyi ayrı ArchivedRecord tablosuna aktar (Sadece Supabase ve SaaS yöneticisi görebilir)
    await prisma.archivedRecord.create({
      data: {
        tableName: 'Vehicle',
        recordId: fullVehicle.id,
        title: `${fullVehicle.plate} - ${fullVehicle.brand} ${fullVehicle.model} (${fullVehicle.owner})`,
        data: JSON.stringify(fullVehicle),
        fleetId: fullVehicle.fleetId,
        deletedBy: currentUser?.name || 'Yönetici',
        reason: 'Araç kullanıcı tarafından silindi ve arşiv tablosuna taşındı.',
      },
    });

    // 2. Ana tablodan tamamen sil (Cascade alt kayıtları da temizler)
    await prisma.vehicle.delete({
      where: { id: params.id },
    });

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'DELETE_VEHICLE',
      target: fullVehicle.plate,
      fleetId: fullVehicle.fleetId,
      description: `${fullVehicle.plate} aracı arşivlenerek sistemden tamamen silindi.`,
    });

    return NextResponse.json({ success: true, message: 'Araç başarıyla arşive aktarılarak silindi.' });
  } catch (error: any) {
    console.error('Vehicle DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Araç silinemedi.' }, { status: 500 });
  }
}
