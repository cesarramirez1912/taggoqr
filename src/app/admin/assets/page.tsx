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
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredAssets = assets.filter(asset => {
    const term = searchTerm.toLowerCase();
    return (
      (asset.licensePlate && asset.licensePlate.toLowerCase().includes(term)) ||
      (asset.customId && asset.customId.toLowerCase().includes(term)) ||
      (asset.name && asset.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mis Activos</h2>
          <p className="text-slate-500">Listado de todos los equipos y vehículos registrados.</p>
        </div>
        <Link href="/admin/assets/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors whitespace-nowrap">
          + Nuevo Activo
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Buscar por chapa/patente, código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando activos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-medium">Código</th>
                  <th className="p-4 font-medium">Nombre / Modelo</th>
                  <th className="p-4 font-medium">Chapa / Patente</th>
                  <th className="p-4 font-medium">Ubicación</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-slate-500 font-medium">
                      {asset.customId}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{asset.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{asset.brand} {asset.model}</div>
                    </td>
                    <td className="p-4">
                      {asset.licensePlate ? (
                        <span className="bg-slate-100 text-slate-700 font-mono px-2 py-1 rounded text-xs border border-slate-200">
                          {asset.licensePlate}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600">{asset.location || "-"}</td>
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
                      <Link href={`/a/${asset.id}`} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Ver Perfil</Link>
                    </td>
                  </tr>
                ))}
                {filteredAssets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      {assets.length === 0 ? (
                        <>
                          <div className="mb-2">No tienes ningún activo registrado.</div>
                          <Link href="/admin/assets/new" className="text-blue-600 font-medium hover:underline">Registrar el primero</Link>
                        </>
                      ) : (
                        <div>No se encontraron vehículos que coincidan con la búsqueda.</div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
