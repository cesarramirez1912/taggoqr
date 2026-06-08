"use client";

import Link from "next/link";
import { useState } from "react";

export default function AssetsListPage() {
  const [assets] = useState([
    { id: "asset_999", customId: "MAQ-001", name: "Tractor John Deere 5000", status: "active", location: "Finca Sur" },
    { id: "asset_888", customId: "VEH-042", name: "Camioneta Hilux", status: "maintenance", location: "Taller Central" }
  ]);

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
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Nombre</th>
              <th className="p-4 font-medium">Ubicación</th>
              <th className="p-4 font-medium">Estado</th>
              <th className="p-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assets.map(asset => (
              <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-mono text-slate-500">{asset.customId}</td>
                <td className="p-4 font-medium text-slate-900">{asset.name}</td>
                <td className="p-4 text-slate-600">{asset.location}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    asset.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {asset.status === 'active' ? 'Operativo' : 'En Mantenimiento'}
                  </span>
                </td>
                <td className="p-4">
                  <Link href={`/a/${asset.id}`} className="text-blue-600 hover:text-blue-800 font-medium">Ver Perfil</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
