"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { QRTag } from "@/lib/repositories/types";

// Esta página recibe el escaneo del QR (ej. taggoqr.app/q/xyz123)
export default function QRScannerRouterPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const qrId = params.qrId as string;
  const [status, setStatus] = useState<"checking" | "unassigned" | "assigned" | "not_found">("checking");
  const [assetId, setAssetId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!qrId) {
      setStatus("not_found");
      return;
    }

    const fetchQR = async () => {
      try {
        const docRef = doc(db, "qrTags", qrId as string);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setStatus("not_found");
          return;
        }

        const data = docSnap.data() as QRTag;
        
        if (data.status === "assigned" && data.assetId) {
          setAssetId(data.assetId);
          setStatus("assigned");
        } else {
          setStatus("unassigned");
        }
      } catch (err) {
        console.error(err);
        setStatus("not_found");
      }
    };

    fetchQR();
  }, [qrId, loading]);

  if (status === "checking") {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Escaneando etiqueta...</div>;
  }

  if (status === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-red-100">
          <h1 className="text-2xl font-bold text-red-600 mb-2">QR No Encontrado</h1>
          <p className="text-slate-600">Este código QR no está registrado en el sistema. Asegúrate de que provenga de TaggoQR.</p>
        </div>
      </div>
    );
  }

  // Si está ASIGNADO, redirigir instantáneamente al perfil público/privado de la máquina
  if (status === "assigned") {
    router.push(`/a/${assetId}`);
    return null;
  }

  // Si está VACÍO, preguntamos qué quiere hacer el Admin
  if (status === "unassigned") {
    if (user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Etiqueta QR en Blanco</h1>
            <p className="text-slate-600 mb-8">Esta pegatina QR <strong>({qrId})</strong> es nueva y no está enlazada a nada.</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => router.push(`/admin/assets/new?qrId=${qrId}`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors shadow-sm"
              >
                Crear Nuevo Activo y Enlazarlo
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">O</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button 
                onClick={() => router.push(`/admin/qr/link?qrId=${qrId}`)}
                className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-3 px-4 rounded-lg font-medium transition-colors shadow-sm"
              >
                Enlazar a un Activo Existente
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      // Es Público y escaneó un QR vacío: No puede hacer nada
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Etiqueta Vacía</h1>
            <p className="text-slate-600">Este QR pertenece al sistema TaggoQR, pero la empresa aún no le ha asignado una máquina.</p>
          </div>
        </div>
      );
    }
  }

  return null;
}
