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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white overflow-hidden relative">
        {/* Fondo decorativo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative flex items-center justify-center mb-10">
          {/* Anillos animados simulando escaneo */}
          <div className="absolute w-40 h-40 border-[3px] border-blue-500/20 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
          <div className="absolute w-28 h-28 border-[3px] border-blue-400/40 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]"></div>
          <div className="absolute w-32 h-32 rounded-full border border-blue-500/30 animate-[spin_4s_linear_infinite] border-t-transparent"></div>
          
          {/* Logo Central */}
          <div className="relative z-10 bg-slate-800 w-20 h-20 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)] border border-slate-700/50">
            <svg className="w-10 h-10 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-black tracking-widest mb-3 flex items-center z-10">
          TAGGO<span className="text-blue-500">QR</span>
        </h2>
        <div className="flex items-center gap-2 z-10">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
        <p className="text-blue-300/80 text-sm tracking-[0.3em] uppercase font-bold mt-4 z-10 animate-pulse">
          Escaneando...
        </p>
      </div>
    );
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
