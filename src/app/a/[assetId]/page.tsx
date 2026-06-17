"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Asset, Maintenance } from "@/lib/repositories/types";

export default function PublicAssetViewPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssetData = async () => {
      if (!assetId) {
        setError("ID de activo no proporcionado.");
        setLoading(false);
        return;
      }
      
      try {
        const docRef = doc(db, "assets", assetId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          setError("Activo no encontrado.");
          setLoading(false);
          return;
        }

        const data = { ...docSnap.data(), id: docSnap.id } as Asset;
        setAsset(data);

        // Fetch Maintenances
        const mQuery = query(
          collection(db, "maintenances"), 
          where("assetId", "==", assetId)
          // orderBy("date", "desc") // Nota: requiere índice en Firestore. Lo ordenamos localmente por ahora.
        );
        const mSnap = await getDocs(mQuery);
        const mList = mSnap.docs.map(d => ({ ...d.data(), id: d.id } as Maintenance));
        
        // Ordenar localmente de más reciente a más antiguo
        mList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMaintenances(mList);

      } catch (err: any) {
        console.error(err);
        setError("Error al cargar los datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssetData();
  }, [assetId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando perfil del activo...</div>;
  if (error || !asset) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  // Verificar si el usuario actual tiene permisos sobre ESTE activo
  const canEdit = profile && profile.tenantRoles && profile.tenantRoles[asset.tenantId];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header del Activo */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
            <div>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2 uppercase tracking-wide">
                {asset.type === 'machine' ? 'Máquina' : asset.type === 'vehicle' ? 'Vehículo' : 'Herramienta'}
              </span>
              <h1 className="text-3xl font-bold text-slate-900">{asset.name}</h1>
              <p className="text-slate-500 font-mono mt-1 text-sm tracking-wide">ID: {asset.customId}</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold text-sm w-max ${
              asset.status === 'active' ? 'bg-green-100 text-green-700' : 
              asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {asset.status === 'active' ? 'Operativo' : 
               asset.status === 'maintenance' ? 'En Mantenimiento' : 'Inactivo'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Marca / Modelo</p>
              <p className="text-slate-900 font-medium">{asset.brand || "-"} / {asset.model || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Año</p>
              <p className="text-slate-900 font-medium">{asset.year || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">VIN / Chasis</p>
              <p className="text-slate-900 font-medium">{asset.vinOrChassis || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Nº Serie Motor</p>
              <p className="text-slate-900 font-medium">{asset.serialNumber || "-"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Uso Actual</p>
              <p className="text-blue-700 font-bold bg-blue-50 inline-block px-2 py-0.5 rounded">{asset.usageMetrics || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Próx. Mantenimiento</p>
              <p className="text-slate-900 font-medium">{asset.nextMaintenanceDate || "No programado"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Ubicación / Sector</p>
              <p className="text-slate-900 font-medium">{asset.location || "No especificada"}</p>
            </div>
          </div>

          {/* Acciones para Admins */}
          {canEdit && (
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
              <button 
                onClick={() => router.push(`/admin/assets/${assetId}/edit`)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                Editar Activo
              </button>
              <button 
                onClick={() => router.push(`/admin/assets/${assetId}/maintenance/new`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
              >
                + Registrar Mantenimiento
              </button>
            </div>
          )}

          {/* Acciones para Operadores */}
          <div className={`pt-6 flex flex-wrap gap-3 ${!canEdit ? 'mt-8 border-t border-slate-100' : 'mt-3'}`}>
            <button 
              onClick={() => router.push(`/a/${assetId}/checklist`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm w-full md:w-auto text-center"
            >
              📋 Checklist Diario
            </button>
          </div>
        </div>

        {/* Historial de Mantenimientos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Historial de Mantenimientos</h2>
          
          {maintenances.length === 0 ? (
            <p className="text-slate-500 italic">No hay mantenimientos registrados aún.</p>
          ) : (
            <div className="space-y-6">
              {maintenances.map(m => (
                <div key={m.id} className="relative pl-6 border-l-2 border-slate-200 last:border-l-0 pb-6 last:pb-0">
                  <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-slate-500 block mb-1">{m.date}</span>
                      {m.usageMetricsSnapshot && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">
                          Uso: {m.usageMetricsSnapshot}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">{m.type}</h3>
                    <p className="text-slate-600 mt-2 whitespace-pre-wrap">{m.description}</p>
                    
                    {m.cost !== undefined && (
                      <p className="mt-3 text-sm font-medium text-slate-700">
                        Costo: <span className="text-slate-900">
                          {m.currency === 'USD' ? 'U$D ' : m.currency === 'BRL' ? 'R$ ' : m.currency === 'ARS' ? 'AR$ ' : m.currency === 'PYG' ? 'Gs. ' : '$ '} 
                          {m.cost.toLocaleString()}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center pb-8 pt-4">
          <p className="text-sm text-slate-400 font-medium">Gestionado por <strong className="text-slate-500">TaggoQR</strong></p>
        </div>

      </div>
    </div>
  );
}
