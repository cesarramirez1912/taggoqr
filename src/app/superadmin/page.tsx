"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

interface TenantData {
  id: string;
  name: string;
  subscriptionStatus: "active" | "disabled" | "trial";
  maxUsers?: number;
  createdAt: any;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    try {
      const snap = await getDocs(collection(db, "tenants"));
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as TenantData));
      setTenants(list);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const toggleStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    await updateDoc(doc(db, "tenants", tenantId), { subscriptionStatus: newStatus });
    fetchTenants();
  };

  if (loading) return <div className="p-8">Cargando empresas...</div>;

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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-4 font-medium">Nombre de la Empresa</th>
              <th className="p-4 font-medium text-center">Usuarios Máx.</th>
              <th className="p-4 font-medium">Estado</th>
              <th className="p-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.map(tenant => (
              <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{tenant.name}</td>
                <td className="p-4 text-center text-slate-600 font-medium">{tenant.maxUsers || 1}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tenant.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {tenant.subscriptionStatus === 'active' ? 'Activa' : 'Deshabilitada'}
                  </span>
                </td>
                <td className="p-4 flex gap-3">
                  <button 
                    onClick={() => toggleStatus(tenant.id, tenant.subscriptionStatus)}
                    className="text-purple-600 hover:text-purple-800 font-medium"
                  >
                    {tenant.subscriptionStatus === 'active' ? 'Deshabilitar' : 'Habilitar'}
                  </button>
                  <button 
                    onClick={() => router.push(`/superadmin/tenants/${tenant.id}/users`)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Gestionar Usuarios
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-slate-500">No hay empresas registradas aún.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
