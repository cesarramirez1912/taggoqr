"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Asset } from "@/lib/repositories/types";

export default function AssetsListPage() {
  const { profile } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || !profile.tenantRoles) return;
    
    const tenantId = Object.keys(profile.tenantRoles)[0];
    if (!tenantId) return;

    const fetchAssets = async () => {
      try {
        const q = query(collection(db, "assets"), where("tenantId", "==", tenantId));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Asset));
        setAssets(list);
      } catch (e) {
        console.error("Error fetching assets:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [profile]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mis Activos</h2>
          <p className="text-slate-500">Listado de todos los equipos y vehículos registrados.</p>
        </div>
        <Link href="/admin/assets/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
          + Nuevo Activo
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando activos...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-4 font-medium">Código</th>
                <th className="p-4 font-medium">Nombre / Modelo</th>
                <th className="p-4 font-medium">Ubicación</th>
                <th className="p-4 font-medium">Uso Actual</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map(asset => (
                <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-slate-500 font-medium">
                    {asset.customId}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{asset.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{asset.brand} {asset.model}</div>
                  </td>
                  <td className="p-4 text-slate-600">{asset.location || "-"}</td>
                  <td className="p-4 text-slate-600">{asset.usageMetrics || "-"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      asset.status === 'active' ? 'bg-green-100 text-green-700' : 
                      asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {asset.status === 'active' ? 'Operativo' : 
                       asset.status === 'maintenance' ? 'En Mantenimiento' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link href={`/a?id=${asset.id}`} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Ver Perfil</Link>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="mb-2">No tienes ningún activo registrado.</div>
                    <Link href="/admin/assets/new" className="text-blue-600 font-medium hover:underline">Registrar el primero</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
