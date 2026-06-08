"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function PublicAssetViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const assetId = params.assetId as string;

  // Mock Asset
  const asset = {
    id: assetId,
    name: "Tractor John Deere 5000",
    customId: "MAQ-001",
    type: "machine",
    status: "active",
    location: "Finca Sur, Lote 4",
    serialNumber: "JD-5000-XYZ",
  };

  const maintenances = [
    { id: "m1", date: "2026-06-05", type: "Cambio de Aceite", desc: "Se reemplazó filtro y aceite." },
    { id: "m2", date: "2026-01-10", type: "Revisión General", desc: "Ajuste de correas y revisión de frenos." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header del Activo */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2 uppercase tracking-wide">
                {asset.type === 'machine' ? 'Máquina' : asset.type}
              </span>
              <h1 className="text-3xl font-bold text-slate-900">{asset.name}</h1>
              <p className="text-slate-500 font-mono mt-1">ID: {asset.customId}</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
              asset.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {asset.status === 'active' ? 'Operativo' : 'En Mantenimiento'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-sm text-slate-500 font-medium">Ubicación</p>
              <p className="text-slate-900">{asset.location}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Nº de Serie</p>
              <p className="text-slate-900">{asset.serialNumber}</p>
            </div>
          </div>

          {/* Acciones para Admins */}
          {user && (
            <div className="mt-6 pt-6 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => router.push(`/admin/assets/${assetId}/edit`)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Editar Activo
              </button>
              <button 
                onClick={() => router.push(`/admin/assets/${assetId}/maintenance/new`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
              >
                + Registrar Mantenimiento
              </button>
            </div>
          )}
        </div>

        {/* Historial de Mantenimientos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Historial de Mantenimientos</h2>
          
          <div className="space-y-6">
            {maintenances.map(m => (
              <div key={m.id} className="relative pl-6 border-l-2 border-slate-200 last:border-l-0 pb-6 last:pb-0">
                <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                <div>
                  <span className="text-sm font-bold text-slate-400 block mb-1">{m.date}</span>
                  <h3 className="text-lg font-semibold text-slate-800">{m.type}</h3>
                  <p className="text-slate-600 mt-1">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pb-8 pt-4">
          <p className="text-sm text-slate-400 font-medium">Gestionado por <strong className="text-slate-500">TaggoQR</strong></p>
        </div>

      </div>
    </div>
  );
}
