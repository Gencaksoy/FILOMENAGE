'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from './Modal';
import { Printer, Download } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plate: string;
  brand: string;
  model: string;
  qrCode: string;
  vehicleId: string;
}

export function QRCodeModal({
  isOpen,
  onClose,
  plate,
  brand,
  model,
  qrCode,
  vehicleId,
}: QRCodeModalProps) {
  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/vehicles/${vehicleId}?qr=${qrCode}` : `/vehicles/${vehicleId}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Araç QR Kodu & Hızlı Erişim" maxWidth="sm">
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 inline-block mb-4">
          <QRCodeSVG value={qrUrl} size={200} level="H" includeMargin={true} />
        </div>
        <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-bold tracking-wider rounded-md text-base mb-1">
          {plate}
        </div>
        <div className="text-sm font-semibold text-slate-800">{brand} {model}</div>
        <div className="text-xs text-slate-500 mt-2 max-w-xs">
          Kurye veya filo personeli bu QR kodu cep telefonu kamerası ile okutarak doğrudan araç detayına ve hızlı KM girişine ulaşabilir.
        </div>

        <div className="mt-6 flex gap-2 w-full">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Yazdır
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-fleet-blue hover:bg-navy-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </Modal>
  );
}
