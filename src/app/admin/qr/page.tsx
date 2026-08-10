"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { writeBatch, doc, collection } from "firebase/firestore";
import { Loader2 } from "lucide-react";

interface MockQR {
  id: string;
  status: "printed" | "assigned";
}

export default function QRGeneratorPage() {
  const { profile } = useAuth();
  const [count, setCount] = useState(10);
  const [generatedQRs, setGeneratedQRs] = useState<MockQR[]>([]);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!profile || !profile.tenantRoles) return;
    const tenantId = Object.keys(profile.tenantRoles)[0];
    if (!tenantId) return;

    setGenerating(true);
    try {
      const batch = writeBatch(db);
      const newTags: MockQR[] = [];

      for (let i = 0; i < count; i++) {
        const newDocRef = doc(collection(db, "qrTags"));
        const tagData = {
          tenantId,
          status: "printed",
          createdAt: new Date(),
          createdBy: profile.id
        };
        batch.set(newDocRef, tagData);
        newTags.push({ id: newDocRef.id, status: "printed" });
      }

      await batch.commit();
      setGeneratedQRs(newTags);
    } catch (err) {
      console.error("Error generating QRs:", err);
      alert("Hubo un error al generar los códigos QR");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="print:hidden">
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
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center min-w-[140px] disabled:opacity-70"
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generar Lote"}
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
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 print:grid-cols-4 print:gap-4">
            {generatedQRs.map(qr => (
              <div key={qr.id} className="flex flex-col items-center justify-start bg-white border-2 border-slate-200 rounded-2xl overflow-hidden print:border-slate-300 print:shadow-none shadow-md hover:shadow-lg transition-shadow" style={{ width: '100%', maxWidth: '200px', margin: '0 auto' }}>
                {/* Header Sticker */}
                <div className="bg-slate-900 w-full py-3 flex flex-col items-center justify-center border-b-4 border-blue-500">
                  <span className="text-white font-black tracking-widest text-lg leading-none">TAGGO<span className="text-blue-500">QR</span></span>
                  <span className="text-slate-400 text-[9px] uppercase tracking-[0.2em] mt-1 font-semibold">Historial Digital</span>
                </div>
                
                {/* Body Sticker */}
                <div className="flex-1 flex flex-col items-center justify-center w-full p-4 bg-slate-50">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm mb-3">
                    <QRCodeSVG 
                      value={`https://taggoqr.web.app/q/${qr.id}`} 
                      size={130} 
                      level="H" // High error correction level for better scanning
                      fgColor="#0f172a" // slate-900
                    />
                  </div>
                  
                  <div className="text-center w-full bg-slate-200 py-1.5 px-1.5 rounded-md overflow-hidden">
                    <span className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-0.5">Escanear para INFO</span>
                    <span className="block w-full truncate font-mono text-[9px] text-slate-600 bg-white px-1 py-0.5 rounded border border-slate-300" title={qr.id.toUpperCase()}>
                      {qr.id.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
