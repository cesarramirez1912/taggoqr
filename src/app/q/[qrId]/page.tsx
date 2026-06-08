"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

// Esta página recibe el escaneo del QR (ej. taggoqr.app/q/xyz123)
export default function QRScannerRouterPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const qrId = params.qrId as string;
  const [status, setStatus] = useState<"checking" | "unassigned" | "assigned" | "not_found">("checking");
  const [assetId, setAssetId] = useState<string | null>(null);

  // Mock global para pruebas. En la vida real haríamos fetch a una API o Server Action
  // ej. const qrTag = await qrTagRepository.getQRTag(qrId);
  const isMockMode = true;

  useEffect(() => {
    if (loading) return;

    // Simulador del backend
    setTimeout(() => {
      // Simulemos que "qr_123" ya tiene un activo asignado, y los demás están vacíos
      if (qrId === "qr_123") {
        setAssetId("asset_999");
        setStatus("assigned");
      } else if (qrId.startsWith("qr_")) {
        setStatus("unassigned");
      } else {
        setStatus("not_found");
      }
    }, 1000);

  }, [qrId, loading]);

  if (status === "checking") {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Escaneando código...</div>;
  }

  if (status === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold text-red-600 mb-2">QR Inválido</h1>
          <p className="text-slate-600">Este código QR no pertenece a nuestro sistema o ha sido deshabilitado.</p>
        </div>
      </div>
    );
  }

  // Lógica principal: Si está ASIGNADO, va al perfil del activo.
  if (status === "assigned") {
    // Todos pueden ver la vista pública del activo (Fase 4)
    router.push(`/a/${assetId}`);
    return null;
  }

  // Lógica secundaria: Si está VACÍO
  if (status === "unassigned") {
    if (isMockMode || user) {
      // Es un Admin: Redirigir al formulario de creación de activo enlazando este QR
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Etiqueta Nueva</h1>
            <p className="text-slate-600 mb-6">Este código QR <strong>({qrId})</strong> aún no tiene un activo asignado.</p>
            <button 
              onClick={() => router.push(`/admin/assets/new?qrId=${qrId}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Asignar a un Activo
            </button>
          </div>
        </div>
      );
    } else {
      // Es Público: No puede hacer nada con un QR vacío
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Etiqueta Vacía</h1>
            <p className="text-slate-600">Este QR aún no ha sido configurado por la empresa.</p>
          </div>
        </div>
      );
    }
  }

  return null;
}
