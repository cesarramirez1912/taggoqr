"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Asset, Tenant } from "@/lib/repositories/types";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ArrowLeft, Printer } from "lucide-react";

export default function PrintAssetQRPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssetAndTenant = async () => {
      try {
        const assetRef = doc(db, "assets", assetId);
        const assetSnap = await getDoc(assetRef);
        
        if (assetSnap.exists()) {
          const assetData = { ...assetSnap.data(), id: assetSnap.id } as Asset;
          setAsset(assetData);

          const tenantRef = doc(db, "tenants", assetData.tenantId);
          const tenantSnap = await getDoc(tenantRef);
          if (tenantSnap.exists()) {
            setTenant({ ...tenantSnap.data(), id: tenantSnap.id } as Tenant);
          }
        }
      } catch (err) {
        console.error("Error fetching data for print:", err);
      } finally {
        setLoading(false);
      }
    };

    if (assetId) {
      fetchAssetAndTenant();
    }
  }, [assetId]);

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando vista previa...</div>;
  if (!asset) return <div className="p-8 text-center text-red-500">Activo no encontrado.</div>;

  const handlePrint = () => {
    window.print();
  };

  // The QR URL points to the public profile of the asset
  const publicUrl = `https://taggoqr.app/a/${asset.id}`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Controls - Hidden on Print */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm print:hidden flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>
        <div className="flex gap-4">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <Printer className="w-5 h-5" /> Imprimir QR
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 p-8 flex items-center justify-center overflow-auto print:p-0 print:block">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full mx-auto print:shadow-none print:rounded-none print:max-w-none print:w-[300px] border-2 border-slate-200 print:border-black text-center print:m-0">
          
          <h2 className="text-xl font-black text-slate-900 print:text-black uppercase tracking-wider mb-1">
            {tenant?.name || "Empresa"}
          </h2>
          <div className="w-12 h-1 bg-blue-600 print:bg-black mx-auto mb-6"></div>

          <div className="bg-slate-50 print:bg-white p-4 rounded-xl border border-slate-200 print:border-transparent inline-block mb-6">
            <QRCodeSVG value={publicUrl} size={180} className="mx-auto" />
          </div>
          
          <h3 className="text-2xl font-bold text-slate-900 print:text-black mb-1">{asset.name}</h3>
          <p className="text-slate-500 print:text-gray-700 font-mono text-sm tracking-widest mb-4">ID: {asset.customId}</p>

          <div className="mt-6 pt-4 border-t border-slate-200 print:border-black border-dashed">
            <p className="text-xs text-slate-400 print:text-gray-500 font-semibold uppercase tracking-wider flex items-center justify-center gap-1">
              <span className="w-3 h-3 bg-blue-600 rounded-sm inline-block print:bg-black"></span>
              Escanea para gestionar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
