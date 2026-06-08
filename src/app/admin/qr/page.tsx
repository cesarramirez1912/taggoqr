"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface MockQR {
  id: string;
  status: "printed" | "assigned";
}

export default function QRGeneratorPage() {
  const [count, setCount] = useState(10);
  const [generatedQRs, setGeneratedQRs] = useState<MockQR[]>([]);

  const handleGenerate = () => {
    // Simular llamada a Server Action para generar lote
    const newTags: MockQR[] = Array.from({ length: count }).map((_, i) => ({
      id: `qr_${Math.random().toString(36).substr(2, 9)}`,
      status: "printed"
    }));
    setGeneratedQRs(newTags);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Generador de QRs Dinámicos</h2>
        <p className="text-slate-500 mt-1">Genera e imprime etiquetas QR vacías. Luego pégalas en tus activos y escanéalas para asignarles información.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex gap-4 items-end print:hidden">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">Cantidad de etiquetas a generar</label>
          <input 
            type="number" 
            value={count} 
            onChange={(e) => setCount(Number(e.target.value))}
            min="1" max="100"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button 
          onClick={handleGenerate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Generar Lote
        </button>
        {generatedQRs.length > 0 && (
          <button 
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Imprimir Etiquetas
          </button>
        )}
      </div>

      {generatedQRs.length > 0 && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 print:grid-cols-4">
            {generatedQRs.map(qr => (
              <div key={qr.id} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl">
                {/* Asumimos que la URL pública base será el dominio actual + /q/ + id */}
                <QRCodeSVG value={`https://taggoqr.app/q/${qr.id}`} size={120} />
                <span className="mt-3 font-mono text-xs text-slate-500">{qr.id}</span>
                <span className="mt-1 text-[10px] font-bold text-slate-400">TaggoQR</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
