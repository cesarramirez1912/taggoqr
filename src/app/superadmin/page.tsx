"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [tenants] = useState([
    { id: "tenant-1", name: "Constructora Alfa", status: "active", users: 5 },
    { id: "tenant-2", name: "Logística Beta", status: "trial", users: 2 }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Empresas (Tenants)</h3>
        <button 
          onClick={() => router.push("/superadmin/new")}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          + Nueva Empresa
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-4 font-medium rounded-tl-lg">ID</th>
              <th className="p-4 font-medium">Nombre</th>
              <th className="p-4 font-medium">Estado</th>
              <th className="p-4 font-medium">Usuarios</th>
              <th className="p-4 font-medium rounded-tr-lg">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-mono text-slate-500">{t.id}</td>
                <td className="p-4 font-medium text-slate-900">{t.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-4">{t.users}</td>
                <td className="p-4">
                  <button className="text-blue-600 hover:text-blue-800 font-medium">Administrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
